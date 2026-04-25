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
}: {
  body: unknown;
  contentType?: string;
  remoteAddress?: string;
}): IncomingMessage => {
  const stream = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage & {
    headers: Record<string, string>;
    socket: { remoteAddress: string };
  };

  stream.headers = {
    "content-type": contentType,
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

test("register service hashes passwords with bcrypt(12), stores token hashes, and emits side effects", async () => {
  const repo = createRepositoryDouble();
  const emittedEvents: Array<{ name: string; data: Record<string, unknown> }> = [];
  const enqueuedJobs: Array<{ email: string; verificationTokenId: string; attempts: number }> = [];
  const service = createRegisterService({
    repository: repo.repository,
    rateLimiter: new RegisterRateLimiter({
      now: fixedNow,
    }),
    now: fixedNow,
    jwtAccessSecret: "test-secret",
    appendEvent: async ({ event }) => {
      emittedEvents.push({
        name: event.name,
        data: event.data,
      });
    },
    enqueueJob: async ({ job }) => {
      enqueuedJobs.push({
        email: job.email,
        verificationTokenId: job.verificationTokenId,
        attempts: job.attempts,
      });
    },
  });
  const payload = validateRegisterInput({
    fullName: "Jane Doe",
    email: "  Jane+Reg@Example.com ",
    password: "StrongPass@123",
  });
  const result = await service.register({
    payload,
    ipAddress: "203.0.113.10",
  });

  assert.equal(result.message, registerServiceConstants.registerSuccessMessage);
  assert.equal(repo.createdUsers.length, 1);
  assert.equal(repo.createdTokens.length, 1);
  assert.equal(repo.createdUsers[0]?.email, "jane+reg@example.com");
  assert.match(repo.createdUsers[0]?.passwordHash ?? "", /^\$2[aby]\$12\$/);
  assert.equal(repo.createdTokens[0]?.tokenHash.length, 64);
  assert.equal(
    repo.createdTokens[0]?.expiresAt.toISOString(),
    new Date(new Date(fixedNowIso).getTime() + registerServiceConstants.verificationTokenTtlMs).toISOString(),
  );
  assert.deepEqual(emittedEvents.map((event) => event.name), ["user.registered"]);
  assert.equal(enqueuedJobs.length, 1);
  assert.equal(enqueuedJobs[0]?.email, "jane+reg@example.com");
  assert.equal(enqueuedJobs[0]?.attempts, 0);
  assert.equal(enqueuedJobs[0]?.verificationTokenId, "token_1");
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
    }),
    (error: unknown) => error instanceof AppError && error.code === "EMAIL_ALREADY_EXISTS",
  );
  await assert.rejects(
    createService(oauthRepo.repository).register({
      payload: oauthPayload,
      ipAddress: "203.0.113.10",
    }),
    (error: unknown) => error instanceof AppError && error.code === "ACCOUNT_EXISTS_OAUTH",
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
    });
    nowMs += 1_000;
  }

  await assert.rejects(
    service.register({
      payload,
      ipAddress: "198.51.100.10",
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
