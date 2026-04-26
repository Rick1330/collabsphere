import assert from "node:assert/strict";
import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import test from "node:test";
import { AppError, createErrorResponse } from "../../apps/api/src/common/filters/app-error.filter.js";
import { createAuthController } from "../../apps/api/src/auth/auth.controller.js";
import {
  createRegisterService,
  registerServiceConstants,
} from "../../apps/api/src/auth/auth.service.js";
import { RegisterRateLimiter } from "../../apps/api/src/auth/register-rate-limit.js";
import { validateRegisterInput } from "../../apps/api/src/auth/register.dto.js";
import type { RegisterRepository } from "../../apps/api/src/auth/auth.repository.js";

const fixedNowIso = "2026-04-25T12:00:00.000Z";
const fixedNow = () => new Date(fixedNowIso);

const createRegisterRequest = ({
  body,
  contentType = "application/json",
  remoteAddress = "203.0.113.10",
  userAgent = "test-agent",
}: {
  body: unknown;
  contentType?: string;
  remoteAddress?: string;
  userAgent?: string;
}): IncomingMessage => {
  const stream = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage & {
    headers: Record<string, string>;
    socket: { remoteAddress: string };
  };

  stream.headers = {
    "content-type": contentType,
    "user-agent": userAgent,
  };
  stream.socket = {
    remoteAddress,
  };

  return stream;
};

const createRepositoryDouble = () => {
  const createdUsers: Array<{ email: string; fullName: string; passwordHash: string }> = [];
  const createdTokens: Array<{ userId: string; tokenHash: string; expiresAt: Date }> = [];
  const existingUsersByEmail = new Map<string, { id: string; authProvider: "local" | "google" }>();
  let userCounter = 0;
  let tokenCounter = 0;

  const repository: RegisterRepository = {
    findActiveUserByEmail: async (email) => existingUsersByEmail.get(email) ?? null,
    createLocalUserWithVerificationToken: async ({
      email,
      fullName,
      passwordHash,
      tokenHash,
      expiresAt,
    }) => {
      userCounter += 1;
      tokenCounter += 1;
      const userId = `user_${userCounter}`;
      createdUsers.push({
        email,
        fullName,
        passwordHash,
      });
      createdTokens.push({
        userId,
        tokenHash,
        expiresAt,
      });
      return {
        user: {
          id: userId,
          email,
          fullName,
        },
        verificationToken: {
          id: `token_${tokenCounter}`,
        },
      };
    },
  };

  return {
    repository,
    createdUsers,
    createdTokens,
    existingUsersByEmail,
  };
};

const buildRegisterServiceUnderTest = ({
  repository,
  now = fixedNow,
}: {
  repository: RegisterRepository;
  now?: () => Date;
}) => {
  const emittedEvents: Array<{ name: string; data: Record<string, unknown> }> = [];
  const enqueuedJobs: Array<{
    email: string;
    verificationTokenId: string;
    attempts: number;
    ipAddress: string;
    userAgent: string;
  }> = [];
  const service = createRegisterService({
    repository,
    rateLimiter: new RegisterRateLimiter({ now }),
    now,
    jwtAccessSecret: "test-secret",
    appendEvent: async ({ event }) => {
      emittedEvents.push({ name: event.name, data: event.data });
    },
    enqueueJob: async ({ job }) => {
      enqueuedJobs.push({
        email: job.email,
        verificationTokenId: job.verificationTokenId,
        attempts: job.attempts,
        ipAddress: job.ipAddress,
        userAgent: job.userAgent,
      });
    },
  });
  return { service, emittedEvents, enqueuedJobs };
};

test("register service hashes passwords with bcrypt(12), stores token hashes, and emits side effects", async () => {
  const repo = createRepositoryDouble();
  const ipAddress = "203.0.113.10";
  const userAgent = "Mozilla/5.0 (X11; Linux x86_64)";
  const { service, emittedEvents, enqueuedJobs } = buildRegisterServiceUnderTest({
    repository: repo.repository,
  });

  const payload = validateRegisterInput({
    fullName: "Jane Doe",
    email: "  Jane+Reg@Example.com ",
    password: "StrongPass@123",
  });
  const result = await service.register({
    payload,
    ipAddress,
    userAgent,
  });

  const [createdUser] = repo.createdUsers;
  const [createdToken] = repo.createdTokens;
  const [enqueuedJob] = enqueuedJobs;
  const [emittedEvent] = emittedEvents;

  assert.ok(createdUser && createdToken && enqueuedJob && emittedEvent);
  assert.equal(result.message, registerServiceConstants.registerSuccessMessage);
  assert.equal(repo.createdUsers.length, 1);
  assert.equal(repo.createdTokens.length, 1);
  assert.equal(createdUser.email, "jane+reg@example.com");
  assert.match(createdUser.passwordHash, /^\$2[aby]\$12\$/);
  assert.equal(createdToken.tokenHash.length, 64);
  assert.equal(
    createdToken.expiresAt.toISOString(),
    new Date(new Date(fixedNowIso).getTime() + registerServiceConstants.verificationTokenTtlMs).toISOString(),
  );
  assert.deepEqual(emittedEvents.map((e) => e.name), ["user.registered"]);
  assert.equal(enqueuedJobs.length, 1);
  assert.equal(enqueuedJob.email, "jane+reg@example.com");
  assert.equal(enqueuedJob.attempts, 0);
  assert.equal(enqueuedJob.verificationTokenId, "token_1");
  assert.equal(enqueuedJob.ipAddress, ipAddress);
  assert.equal(enqueuedJob.userAgent, userAgent);
  assert.equal(emittedEvent.data.ipAddress, ipAddress);
  assert.equal(emittedEvent.data.userAgent, userAgent);
});

test("register service writes failed user.registered events to dead-letter storage", async () => {
  const repo = createRepositoryDouble();
  const deadLetterEvents: Array<{ name: string; data: Record<string, unknown> }> = [];

  const service = createRegisterService({
    repository: repo.repository,
    rateLimiter: new RegisterRateLimiter({
      now: fixedNow,
    }),
    now: fixedNow,
    jwtAccessSecret: "test-secret",
    appendEvent: async () => {
      throw new Error("event stream unavailable");
    },
    appendDeadLetter: async ({ event }) => {
      deadLetterEvents.push({
        name: event.name,
        data: event.data,
      });
    },
    enqueueJob: async () => {},
  });

  await service.register({
    payload: validateRegisterInput({
      fullName: "Jane Doe",
      email: "dlq@example.com",
      password: "StrongPass@123",
    }),
    ipAddress: "203.0.113.11",
    userAgent: "test-agent",
  });

  assert.equal(deadLetterEvents[0]?.name, "user.registered");
  assert.equal(deadLetterEvents[0]?.data.email, "dlq@example.com");
});

test("register controller maps unique persistence errors to EMAIL_ALREADY_EXISTS", async () => {
  const controller = createAuthController({
    registerService: {
      register: async () => {
        throw {
          code: "P2002",
        };
      },
    },
  });

  await assert.rejects(
    controller.register({
      request: createRegisterRequest({
        body: {
          fullName: "Jane Doe",
          email: "jane@example.com",
          password: "StrongPass@123",
        },
      }),
    }),
    (error: unknown) => error instanceof AppError && error.code === "EMAIL_ALREADY_EXISTS",
  );
});

test("register controller requires application/json media type", async () => {
  const controller = createAuthController({
    registerService: {
      register: async () => ({ message: "ok" }),
    },
  });

  await assert.rejects(
    controller.register({
      request: createRegisterRequest({
        contentType: "text/application/json-patch",
        body: {
          fullName: "Jane Doe",
          email: "jane@example.com",
          password: "StrongPass@123",
        },
      }),
    }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("register service rejects duplicate local and oauth emails with canonical conflict codes", async () => {
  const localRepo = createRepositoryDouble();
  localRepo.existingUsersByEmail.set("existing@example.com", {
    id: "user_existing_local",
    authProvider: "local",
  });
  const oauthRepo = createRepositoryDouble();
  oauthRepo.existingUsersByEmail.set("oauth@example.com", {
    id: "user_existing_google",
    authProvider: "google",
  });
  const createService = (repository: RegisterRepository) =>
    createRegisterService({
      repository,
      rateLimiter: new RegisterRateLimiter({
        now: fixedNow,
      }),
      now: fixedNow,
      jwtAccessSecret: "test-secret",
      appendEvent: async () => {},
      enqueueJob: async () => {},
    });
  const duplicatePayload = validateRegisterInput({
    fullName: "Jane Doe",
    email: "existing@example.com",
    password: "StrongPass@123",
  });
  const oauthPayload = validateRegisterInput({
    fullName: "Jane Doe",
    email: "oauth@example.com",
    password: "StrongPass@123",
  });

  await assert.rejects(
    createService(localRepo.repository).register({
      payload: duplicatePayload,
      ipAddress: "203.0.113.10",
      userAgent: "test-agent",
    }),
    (error: unknown) => error instanceof AppError && error.code === "EMAIL_ALREADY_EXISTS",
  );
  await assert.rejects(
    createService(oauthRepo.repository).register({
      payload: oauthPayload,
      ipAddress: "203.0.113.10",
      userAgent: "test-agent",
    }),
    (error: unknown) => error instanceof AppError && error.code === "EMAIL_ALREADY_EXISTS",
  );
});

test("register rate limiting enforces 5/hour per ip and per email and exposes Retry-After", async () => {
  let nowMs = new Date(fixedNowIso).getTime();
  const now = () => new Date(nowMs);
  const repo = createRepositoryDouble();
  const service = createRegisterService({
    repository: repo.repository,
    rateLimiter: new RegisterRateLimiter({
      now,
    }),
    now,
    jwtAccessSecret: "test-secret",
    appendEvent: async () => {},
    enqueueJob: async () => {},
  });
  const payload = validateRegisterInput({
    fullName: "Jane Doe",
    email: "rate-limit@example.com",
    password: "StrongPass@123",
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await service.register({
      payload,
      ipAddress: "198.51.100.10",
      userAgent: "test-agent",
    });
    nowMs += 1_000;
  }

  await assert.rejects(
    service.register({
      payload,
      ipAddress: "198.51.100.10",
      userAgent: "test-agent",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === "RATE_LIMITED" &&
      typeof error.headers?.["Retry-After"] === "string",
  );
});

test("weak passwords fail with PASSWORD_TOO_WEAK and 429 headers are preserved in envelopes", () => {
  assert.throws(
    () =>
      validateRegisterInput({
        fullName: "Jane Doe",
        email: "jane@example.com",
        password: "weakpass",
      }),
    (error: unknown) => error instanceof AppError && error.code === "PASSWORD_TOO_WEAK",
  );
  assert.throws(
    () =>
      validateRegisterInput({
        fullName: "Jane Doe",
        email: "jane@example.com",
        password: `${"A".repeat(97)}a1!`,
      }),
    (error: unknown) => error instanceof AppError && error.code === "PASSWORD_TOO_WEAK",
  );

  const rateLimitError = new AppError({
    code: "RATE_LIMITED",
    headers: {
      "Retry-After": "3600",
    },
  });
  const response = createErrorResponse({
    error: rateLimitError,
    requestId: "req_rate_limit",
    timestamp: "2026-04-25T12:00:00.000Z",
  });

  assert.equal(response.statusCode, 429);
  assert.equal(response.headers?.["Retry-After"], "3600");
  assert.equal(response.payload.error.code, "RATE_LIMITED");
});

test("register rate limiter prunes expired buckets to prevent unbounded growth", async () => {
  let nowMs = new Date(fixedNowIso).getTime();
  const now = () => new Date(nowMs);
  const limiter = new RegisterRateLimiter({ now });

  for (let index = 0; index < 20; index += 1) {
    limiter.consume({
      ipAddress: "198.51.100.55",
      normalizedEmail: `user-${index}@example.com`,
    });
    nowMs += 61 * 60 * 1000;
  }

  limiter.consume({
    ipAddress: "198.51.100.55",
    normalizedEmail: "fresh@example.com",
  });

  const limiterState = limiter as unknown as {
    ipBuckets: Map<string, { timestamps: number[] }>;
    emailBuckets: Map<string, { timestamps: number[] }>;
  };
  assert.ok((limiterState.ipBuckets.get("198.51.100.55")?.timestamps.length ?? 0) <= 1);
  assert.ok(limiterState.emailBuckets.size <= 2);
});
