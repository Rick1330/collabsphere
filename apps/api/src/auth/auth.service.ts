import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  createVerificationEmailJob,
  encryptVerificationToken,
  enqueueVerificationEmailJob,
} from "./verification-email-queue.js";
import {
  appendAuthDomainEvent,
  appendAuthDomainEventDeadLetter,
  type AuthDomainEvent,
} from "./auth-events.js";
import { AppError } from "../common/filters/app-error.filter.js";
import { type RegisterInput } from "./register.dto.js";
import { type VerifyEmailInput } from "./verify-email.dto.js";
import {
  createPrismaRegisterRepository,
  createPrismaVerifyEmailRepository,
  isUniqueConstraintError,
  type RegisterRepository,
  type VerifyEmailRepository,
} from "./auth.repository.js";
import { RegisterRateLimiter } from "./register-rate-limit.js";

const registerSuccessMessage = "Registration successful. Please verify your email.";
const verifyEmailSuccessMessage = "Email verified successfully.";
const defaultBcryptCostFactor = 12;
const verificationTokenTtlMs = 24 * 60 * 60 * 1000;

const hashSha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

const createOpaqueToken = () => randomBytes(32).toString("base64url");

const assertRegistrationEmailAvailable = ({
  existingUser,
}: {
  existingUser: Awaited<ReturnType<RegisterRepository["findActiveUserByEmail"]>>;
}) => {
  if (!existingUser) {
    return;
  }

  throw new AppError({
    code: "EMAIL_ALREADY_EXISTS",
    message: "Email already exists",
  });
};

const createUserRegisteredEvent = ({
  userId,
  email,
  ipAddress,
  userAgent,
  now,
}: {
  userId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  now: Date;
}): AuthDomainEvent => ({
  eventId: randomUUID(),
  name: "user.registered",
  occurredAt: now.toISOString(),
  actor: {
    userId,
    workspaceId: null,
  },
  data: {
    userId,
    email,
    ipAddress,
    userAgent,
  },
});

const createUserEmailVerifiedEvent = ({
  userId,
  email,
  now,
}: {
  userId: string;
  email: string;
  now: Date;
}): AuthDomainEvent => ({
  eventId: randomUUID(),
  name: "user.email_verified",
  occurredAt: now.toISOString(),
  actor: {
    userId,
    workspaceId: null,
  },
  data: {
    userId,
    email,
  },
});

const emitAuthEvent = async ({
  event,
  appendEvent,
  appendDeadLetter,
  logLabel,
}: {
  event: AuthDomainEvent;
  appendEvent: typeof appendAuthDomainEvent;
  appendDeadLetter: typeof appendAuthDomainEventDeadLetter;
  logLabel: AuthDomainEvent["name"];
}) => {
  await appendEvent({
    event,
  }).catch(async (error) => {
    const message = error instanceof Error ? error.message : String(error);
    await appendDeadLetter({
      event,
    }).catch((deadLetterError) => {
      const deadLetterMessage =
        deadLetterError instanceof Error ? deadLetterError.message : String(deadLetterError);
      console.warn(`[api] failed to append ${logLabel} dead-letter event: ${deadLetterMessage}`);
    });
    console.warn(`[api] failed to append ${logLabel} event: ${message}`);
  });
};

const dispatchVerificationEmail = async ({
  userId,
  email,
  fullName,
  tokenId,
  token,
  issuedAt,
  ipAddress,
  userAgent,
  jwtAccessSecret,
  enqueueJob,
}: {
  userId: string;
  email: string;
  fullName: string;
  tokenId: string;
  token: string;
  issuedAt: Date;
  ipAddress: string;
  userAgent: string;
  jwtAccessSecret: string;
  enqueueJob: typeof enqueueVerificationEmailJob;
}) => {
  const encryptedVerificationToken = encryptVerificationToken({
    token,
    secret: jwtAccessSecret,
  });
  const verificationJob = createVerificationEmailJob({
    userId,
    email,
    fullName,
    ipAddress,
    userAgent,
    verificationTokenId: tokenId,
    encryptedVerificationToken,
    now: issuedAt,
  });

  await enqueueJob({
    job: verificationJob,
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[api] failed to enqueue verification email job: ${message}`);
  });
};

export type RegisterService = {
  register: (input: {
    payload: RegisterInput;
    ipAddress: string;
    userAgent: string;
  }) => Promise<{ message: string }>;
};

export type VerifyEmailService = {
  verifyEmail: (input: { payload: VerifyEmailInput }) => Promise<{ message: string }>;
};

const createTokenExpiredError = () =>
  new AppError({
    code: "TOKEN_EXPIRED",
    message: "Verification token has expired",
    // Verification links are one-time resources that are gone after TTL, so this endpoint
    // intentionally overrides the catalog default for TOKEN_EXPIRED and responds with 410.
    // See also TOKEN_INVALID override below and docs/agent-ref/api/auth-endpoints.md:49.
    statusCode: 410,
  });

const resolveUsableEmailVerificationRecord = ({
  verification,
  now,
}: {
  verification: Awaited<ReturnType<VerifyEmailRepository["findEmailVerificationByHash"]>>;
  now: Date;
}) => {
  if (!verification) {
    throw new AppError({
      code: "TOKEN_INVALID",
      message: "Verification token is invalid",
      // Verify-email tokens are standalone resources, not session credentials, so this
      // endpoint intentionally overrides the catalog default for TOKEN_INVALID (401 -> 400).
      // See also TOKEN_EXPIRED override above and docs/agent-ref/api/auth-endpoints.md:49.
      statusCode: 400,
    });
  }

  if (verification.usedAt) {
    throw new AppError({
      code: "TOKEN_ALREADY_USED",
      message: "Verification token has already been used",
    });
  }

  if (verification.expiresAt.getTime() <= now.getTime()) {
    throw createTokenExpiredError();
  }

  return verification;
};

export const createRegisterService = ({
  repository,
  rateLimiter,
  now = () => new Date(),
  bcryptCostFactor = defaultBcryptCostFactor,
  jwtAccessSecret,
  appendEvent = appendAuthDomainEvent,
  appendDeadLetter = appendAuthDomainEventDeadLetter,
  enqueueJob = enqueueVerificationEmailJob,
}: {
  repository: RegisterRepository;
  rateLimiter: RegisterRateLimiter;
  now?: () => Date;
  bcryptCostFactor?: number;
  jwtAccessSecret: string;
  appendEvent?: typeof appendAuthDomainEvent;
  appendDeadLetter?: typeof appendAuthDomainEventDeadLetter;
  enqueueJob?: typeof enqueueVerificationEmailJob;
}): RegisterService => ({
  register: async ({ payload, ipAddress, userAgent }) => {
    rateLimiter.consume({
      ipAddress,
      normalizedEmail: payload.email,
    });

    const existingUser = await repository.findActiveUserByEmail(payload.email);

    assertRegistrationEmailAvailable({ existingUser });

    const passwordHash = await bcrypt.hash(payload.password, bcryptCostFactor);
    const verificationToken = createOpaqueToken();
    const verificationTokenHash = hashSha256(verificationToken);
    const expiresAt = new Date(now().getTime() + verificationTokenTtlMs);
    const registrationResult = await repository.createLocalUserWithVerificationToken({
      email: payload.email,
      fullName: payload.fullName,
      passwordHash,
      tokenHash: verificationTokenHash,
      expiresAt,
    });
    const registeredUser = registrationResult.user;
    const storedToken = registrationResult.verificationToken;

    await emitAuthEvent({
      event: createUserRegisteredEvent({
        userId: registeredUser.id,
        email: registeredUser.email,
        ipAddress,
        userAgent,
        now: now(),
      }),
      appendEvent,
      appendDeadLetter,
      logLabel: "user.registered",
    });

    await dispatchVerificationEmail({
      userId: registeredUser.id,
      email: registeredUser.email,
      fullName: registeredUser.fullName,
      tokenId: storedToken.id,
      token: verificationToken,
      issuedAt: now(),
      ipAddress,
      userAgent,
      jwtAccessSecret,
      enqueueJob,
    });

    return {
      message: registerSuccessMessage,
    };
  },
});

export const createVerifyEmailService = ({
  repository,
  now = () => new Date(),
  appendEvent = appendAuthDomainEvent,
  appendDeadLetter = appendAuthDomainEventDeadLetter,
}: {
  repository: VerifyEmailRepository;
  now?: () => Date;
  appendEvent?: typeof appendAuthDomainEvent;
  appendDeadLetter?: typeof appendAuthDomainEventDeadLetter;
}): VerifyEmailService => ({
  verifyEmail: async ({ payload }) => {
    const currentTime = now();
    const tokenHash = hashSha256(payload.token);
    const verification = resolveUsableEmailVerificationRecord({
      verification: await repository.findEmailVerificationByHash(tokenHash),
      now: currentTime,
    });

    const verifiedUser = await repository.consumeEmailVerificationToken({
      tokenId: verification.id,
      userId: verification.userId,
      verifiedAt: currentTime,
    });

    if (!verifiedUser) {
      throw new AppError({
        code: "TOKEN_ALREADY_USED",
        message: "Verification token has already been used",
      });
    }

    await emitAuthEvent({
      event: createUserEmailVerifiedEvent({
        userId: verifiedUser.id,
        email: verifiedUser.email,
        now: currentTime,
      }),
      appendEvent,
      appendDeadLetter,
      logLabel: "user.email_verified",
    });

    return {
      message: verifyEmailSuccessMessage,
    };
  },
});

export const createPrismaBackedRegisterService = ({
  prisma,
  bcryptCostFactor,
  jwtAccessSecret,
  now,
}: {
  prisma: Parameters<typeof createPrismaRegisterRepository>[0]["prisma"];
  bcryptCostFactor?: number;
  jwtAccessSecret: string;
  now?: () => Date;
}) =>
  createRegisterService({
    repository: createPrismaRegisterRepository({
      prisma,
    }),
    rateLimiter: new RegisterRateLimiter({
      now,
    }),
    now,
    bcryptCostFactor,
    jwtAccessSecret,
  });

export const createPrismaBackedVerifyEmailService = ({
  prisma,
  now,
}: {
  prisma: Parameters<typeof createPrismaVerifyEmailRepository>[0]["prisma"];
  now?: () => Date;
}) =>
  createVerifyEmailService({
    repository: createPrismaVerifyEmailRepository({
      prisma,
    }),
    now,
  });

export const mapRegisterPersistenceError = (error: unknown) => {
  if (isUniqueConstraintError(error)) {
    return new AppError({
      code: "EMAIL_ALREADY_EXISTS",
      message: "Email already exists",
      cause: error,
    });
  }

  return error;
};

export const authServiceConstants = {
  bcryptCostFactor: defaultBcryptCostFactor,
  registerSuccessMessage,
  verifyEmailSuccessMessage,
  verificationTokenTtlMs,
} as const;
