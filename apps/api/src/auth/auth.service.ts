import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthProvider } from "@prisma/client";
import {
  createVerificationEmailJob,
  encryptVerificationToken,
  enqueueVerificationEmailJob,
} from "./verification-email-queue.js";
import { appendAuthDomainEvent, type AuthDomainEvent } from "./auth-events.js";
import { AppError } from "../common/filters/app-error.filter.js";
import { type RegisterInput } from "./register.dto.js";
import {
  createPrismaRegisterRepository,
  isUniqueConstraintError,
  type RegisterRepository,
} from "./auth.repository.js";
import { RegisterRateLimiter } from "./register-rate-limit.js";

const registerSuccessMessage = "Registration successful. Please verify your email.";
const bcryptCostFactor = 12;
const verificationTokenTtlMs = 24 * 60 * 60 * 1000;

const hashSha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

const createOpaqueToken = () => randomBytes(32).toString("base64url");

export type RegisterService = {
  register: (input: {
    payload: RegisterInput;
    ipAddress: string;
  }) => Promise<{ message: string }>;
};

export const createRegisterService = ({
  repository,
  rateLimiter,
  now = () => new Date(),
  jwtAccessSecret,
  appendEvent = appendAuthDomainEvent,
  enqueueJob = enqueueVerificationEmailJob,
}: {
  repository: RegisterRepository;
  rateLimiter: RegisterRateLimiter;
  now?: () => Date;
  jwtAccessSecret: string;
  appendEvent?: typeof appendAuthDomainEvent;
  enqueueJob?: typeof enqueueVerificationEmailJob;
}): RegisterService => ({
  register: async ({ payload, ipAddress }) => {
    rateLimiter.consume({
      ipAddress,
      normalizedEmail: payload.email,
    });

    const existingUser = await repository.findActiveUserByEmail(payload.email);

    if (existingUser) {
      if (existingUser.authProvider === AuthProvider.google) {
        throw new AppError({
          code: "ACCOUNT_EXISTS_OAUTH",
          message: "Account exists with OAuth provider",
        });
      }

      throw new AppError({
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(payload.password, bcryptCostFactor);
    const registeredUser = await repository.createLocalUser({
      email: payload.email,
      fullName: payload.fullName,
      passwordHash,
    });
    const verificationToken = createOpaqueToken();
    const verificationTokenHash = hashSha256(verificationToken);
    const expiresAt = new Date(now().getTime() + verificationTokenTtlMs);
    const storedToken = await repository.createEmailVerificationToken({
      userId: registeredUser.id,
      tokenHash: verificationTokenHash,
      expiresAt,
    });

    const userRegisteredEvent: AuthDomainEvent = {
      eventId: randomUUID(),
      name: "user.registered",
      occurredAt: now().toISOString(),
      actor: {
        userId: registeredUser.id,
        workspaceId: null,
      },
      data: {
        userId: registeredUser.id,
        email: registeredUser.email,
      },
    };

    await appendEvent({
      event: userRegisteredEvent,
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[api] failed to append user.registered event: ${message}`);
    });

    const encryptedVerificationToken = encryptVerificationToken({
      token: verificationToken,
      secret: jwtAccessSecret,
    });
    const verificationJob = createVerificationEmailJob({
      userId: registeredUser.id,
      email: registeredUser.email,
      fullName: registeredUser.fullName,
      verificationTokenId: storedToken.id,
      encryptedVerificationToken,
      now: now(),
    });

    await enqueueJob({
      job: verificationJob,
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[api] failed to enqueue verification email job: ${message}`);
    });

    return {
      message: registerSuccessMessage,
    };
  },
});

export const createPrismaBackedRegisterService = ({
  prisma,
  jwtAccessSecret,
  now,
}: {
  prisma: Parameters<typeof createPrismaRegisterRepository>[0]["prisma"];
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
    jwtAccessSecret,
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

export const registerServiceConstants = {
  bcryptCostFactor,
  registerSuccessMessage,
  verificationTokenTtlMs,
} as const;
