import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import test from "node:test";
import { AppError } from "../../apps/api/src/common/filters/app-error.filter.js";
import { createAuthController } from "../../apps/api/src/auth/auth.controller.js";
import {
  createVerifyEmailService,
  authServiceConstants,
} from "../../apps/api/src/auth/auth.service.js";
import { VerifyEmailRateLimiter } from "../../apps/api/src/auth/verify-email-rate-limit.js";
import type {
  EmailVerificationRecord,
  VerifyEmailRepository,
} from "../../apps/api/src/auth/auth.repository.js";
import { validateVerifyEmailInput } from "../../apps/api/src/auth/verify-email.dto.js";

const fixedNowIso = "2026-04-26T12:00:00.000Z";
const fixedNow = () => new Date(fixedNowIso);

const hashSha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

const createJsonRequest = ({
  body,
  contentType = "application/json",
}: {
  body: unknown;
  contentType?: string;
}): IncomingMessage => {
  const stream = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage & {
    headers: Record<string, string>;
    socket: { remoteAddress: string };
  };

  stream.headers = {
    "content-type": contentType,
  };
  stream.socket = {
    remoteAddress: "203.0.113.30",
  };

  return stream;
};

const createVerifyEmailRepositoryDouble = () => {
  const recordsByHash = new Map<string, EmailVerificationRecord>();
  const consumedTokens: Array<{ tokenId: string; userId: string; verifiedAt: Date }> = [];
  const consumeFailures = new Set<string>();
  const usersById = new Map<string, { id: string; email: string; isVerified: boolean; deletedAt: Date | null }>();

  const repository: VerifyEmailRepository = {
    findEmailVerificationByHash: async (tokenHash) => {
      const record = recordsByHash.get(tokenHash) ?? null;
      if (!record) return null;
      const user = usersById.get(record.userId);
      if (user && user.deletedAt !== null) return null;
      return record;
    },
    consumeEmailVerificationToken: async ({ tokenId, userId, verifiedAt }) => {
      consumedTokens.push({
        tokenId,
        userId,
        verifiedAt,
      });

      if (consumeFailures.has(tokenId)) {
        return null;
      }

      const matchedRecord = [...recordsByHash.values()].find((record) => record.id === tokenId);
      if (!matchedRecord) {
        return null;
      }

      const user = usersById.get(userId);
      if (user) {
        user.isVerified = true;
      }

      return {
        id: userId,
        email: matchedRecord.email,
      };
    },
  };

  return {
    repository,
    recordsByHash,
    consumedTokens,
    consumeFailures,
    usersById,
  };
};

const createVerifyEmailServiceUnderTest = (repository: VerifyEmailRepository) =>
  createVerifyEmailService({
    repository,
    rateLimiter: new VerifyEmailRateLimiter({ now: fixedNow }),
    now: fixedNow,
  });

const addVerificationRecord = ({
  repo,
  rawToken,
  record,
}: {
  repo: ReturnType<typeof createVerifyEmailRepositoryDouble>;
  rawToken: string;
  record: Omit<EmailVerificationRecord, "email"> & { email?: string };
}) => {
  repo.recordsByHash.set(hashSha256(rawToken), {
    ...record,
    email: record.email ?? "verify@example.com",
  });
};

test("verify email service marks the token used and emits user.email_verified", async () => {
  const repo = createVerifyEmailRepositoryDouble();
  const emittedEvents: Array<{ name: string; data: Record<string, unknown> }> = [];
  const rawToken = "opaque-verification-token";
  repo.recordsByHash.set(hashSha256(rawToken), {
    id: "token_1",
    userId: "user_1",
    email: "learner@example.com",
    expiresAt: new Date("2026-04-27T12:00:00.000Z"),
    usedAt: null,
  });

  repo.usersById.set("user_1", {
    id: "user_1",
    email: "learner@example.com",
    isVerified: false,
    deletedAt: null,
  });

  const service = createVerifyEmailService({
    repository: repo.repository,
    rateLimiter: new VerifyEmailRateLimiter({ now: fixedNow }),
    now: fixedNow,
    appendEvent: async ({ event }) => {
      emittedEvents.push({
        name: event.name,
        data: event.data,
      });
    },
  });

  const result = await service.verifyEmail({
    payload: validateVerifyEmailInput({
      token: rawToken,
    }),
    ipAddress: "203.0.113.30",
  });

  assert.equal(result.message, authServiceConstants.verifyEmailSuccessMessage);
  assert.equal(repo.consumedTokens.length, 1);
  assert.deepEqual(
    {
      tokenId: repo.consumedTokens[0]?.tokenId,
      userId: repo.consumedTokens[0]?.userId,
      verifiedAt: repo.consumedTokens[0]?.verifiedAt.toISOString(),
    },
    {
      tokenId: "token_1",
      userId: "user_1",
      verifiedAt: fixedNowIso,
    },
  );
  assert.deepEqual(emittedEvents.map((event) => event.name), ["user.email_verified"]);
  assert.equal(emittedEvents[0]?.data.userId, "user_1");
  assert.equal(emittedEvents[0]?.data.email, "learner@example.com");
  assert.equal(repo.usersById.get("user_1")?.isVerified, true);
});

test("verify email service dead-letter fallback for email_verified", async () => {
  const repo = createVerifyEmailRepositoryDouble();
  const deadLetterEvents: Array<{ name: string; data: Record<string, unknown> }> = [];
  const rawToken = "opaque-verification-token";
  repo.recordsByHash.set(hashSha256(rawToken), {
    id: "token_1",
    userId: "user_1",
    email: "learner@example.com",
    expiresAt: new Date("2026-04-27T12:00:00.000Z"),
    usedAt: null,
  });
  repo.usersById.set("user_1", {
    id: "user_1",
    email: "learner@example.com",
    isVerified: false,
    deletedAt: null,
  });

  const service = createVerifyEmailService({
    repository: repo.repository,
    rateLimiter: new VerifyEmailRateLimiter({ now: fixedNow }),
    now: fixedNow,
    appendEvent: async () => {
      throw new Error("Event stream failed");
    },
    appendDeadLetter: async ({ event }) => {
      deadLetterEvents.push({ name: event.name, data: event.data });
    },
  });

  await service.verifyEmail({
    payload: validateVerifyEmailInput({
      token: rawToken,
    }),
    ipAddress: "203.0.113.30",
  });

  assert.equal(deadLetterEvents.length, 1);
  assert.equal(deadLetterEvents[0]?.name, "user.email_verified");
  assert.equal(deadLetterEvents[0]?.data.userId, "user_1");
});

test("verify email service returns TOKEN_INVALID for an unknown token", async () => {
  const repo = createVerifyEmailRepositoryDouble();
  const service = createVerifyEmailServiceUnderTest(repo.repository);

  await assert.rejects(
    service.verifyEmail({
      payload: validateVerifyEmailInput({
        token: "missing-token",
      }),
      ipAddress: "203.0.113.30",
    }),
    (error: unknown) => error instanceof AppError && error.code === "TOKEN_INVALID",
  );
});

test("verify email service maps token failure paths to canonical errors", async () => {
  const scenarios = [
    {
      rawToken: "expired-token",
      record: {
        id: "token_2",
        userId: "user_2",
        email: "expired@example.com",
        expiresAt: new Date("2026-04-26T11:59:59.000Z"),
        usedAt: null,
      },
      expectedError: (error: unknown) =>
        error instanceof AppError && error.code === "TOKEN_EXPIRED" && error.statusCode === 410,
    },
    {
      rawToken: "used-token",
      record: {
        id: "token_3",
        userId: "user_3",
        email: "used@example.com",
        expiresAt: new Date("2026-04-27T12:00:00.000Z"),
        usedAt: new Date("2026-04-26T10:00:00.000Z"),
      },
      expectedError: (error: unknown) => error instanceof AppError && error.code === "TOKEN_ALREADY_USED",
    },
    {
      rawToken: "raced-token",
      record: {
        id: "token_4",
        userId: "user_4",
        email: "race@example.com",
        expiresAt: new Date("2026-04-27T12:00:00.000Z"),
        usedAt: null,
      },
      consumeFailureTokenId: "token_4",
      expectedError: (error: unknown) => error instanceof AppError && error.code === "TOKEN_ALREADY_USED",
    },
    {
      rawToken: "deleted-user-token",
      record: {
        id: "token_5",
        userId: "user_5",
        email: "deleted@example.com",
        expiresAt: new Date("2026-04-27T12:00:00.000Z"),
        usedAt: null,
      },
      user: {
        id: "user_5",
        email: "deleted@example.com",
        isVerified: false,
        deletedAt: new Date("2026-04-26T11:00:00.000Z"),
      },
      expectedError: (error: unknown) => error instanceof AppError && error.code === "TOKEN_INVALID",
    },
  ] as const;

  for (const scenario of scenarios) {
    const repo = createVerifyEmailRepositoryDouble();
    addVerificationRecord({
      repo,
      rawToken: scenario.rawToken,
      record: scenario.record,
    });
    if ("user" in scenario && scenario.user) {
      repo.usersById.set(scenario.user.id, scenario.user);
    }

    if ("consumeFailureTokenId" in scenario && scenario.consumeFailureTokenId) {
      repo.consumeFailures.add(scenario.consumeFailureTokenId);
    }

    const service = createVerifyEmailServiceUnderTest(repo.repository);

    await assert.rejects(
      service.verifyEmail({
      payload: validateVerifyEmailInput({
          token: scenario.rawToken,
        }),
        ipAddress: "203.0.113.30",
      }),
      scenario.expectedError,
    );
  }
});

test("verify email controller validates application/json and trims the token payload", async () => {
  let capturedPayload: { token: string } | null = null;
  const controller = createAuthController({
    registerService: {
      register: async () => ({ message: "unused" }),
    },
    verifyEmailService: {
      verifyEmail: async ({ payload }) => {
        capturedPayload = payload;
        return { message: authServiceConstants.verifyEmailSuccessMessage };
      },
    },
  });

  const result = await controller.verifyEmail({
    request: createJsonRequest({
      body: {
        token: "  token-value-valid  ",
      },
    }),
  });

  assert.equal(result.message, authServiceConstants.verifyEmailSuccessMessage);
  assert.deepEqual(capturedPayload, {
    token: "token-value-valid",
  });

  await assert.rejects(
    controller.verifyEmail({
      request: createJsonRequest({
        contentType: "text/plain",
        body: {
          token: "ignored",
        },
      }),
    }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("verify email DTO rejects tokens exceeding the maximum allowed length or invalid format", () => {
  const oversizedToken = "a".repeat(513);
  const tooShortToken = "short";
  const spaceToken = "invalid space token";

  assert.throws(
    () =>
      validateVerifyEmailInput({
        token: oversizedToken,
      }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );

  assert.throws(
    () => validateVerifyEmailInput({ token: tooShortToken }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );

  assert.throws(
    () => validateVerifyEmailInput({ token: spaceToken }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("verify email service limits requests to 10 per 5 minutes per IP", async () => {
  let currentTimeMs = new Date("2026-04-26T12:00:00.000Z").getTime();
  const mutableNow = () => new Date(currentTimeMs);
  const repo = createVerifyEmailRepositoryDouble();
  
  const service = createVerifyEmailService({
    repository: repo.repository,
    rateLimiter: new VerifyEmailRateLimiter({ now: mutableNow }),
    now: mutableNow,
  });

  for (let i = 0; i < 10; i++) {
    await assert.rejects(
      service.verifyEmail({
        payload: { token: "token-will-fail-anyway-due-to-missing" },
        ipAddress: "192.168.1.100",
      }),
      (error: unknown) => error instanceof AppError && error.code === "TOKEN_INVALID"
    );
  }

  await assert.rejects(
    service.verifyEmail({
      payload: { token: "token-will-fail-anyway-due-to-missing" },
      ipAddress: "192.168.1.100",
    }),
    (error: unknown) => error instanceof AppError && error.code === "RATE_LIMITED"
  );

  currentTimeMs += 5 * 60 * 1000 + 1000;

  await assert.rejects(
    service.verifyEmail({
      payload: { token: "token-will-fail-anyway-due-to-missing" },
      ipAddress: "192.168.1.100",
    }),
    (error: unknown) => error instanceof AppError && error.code === "TOKEN_INVALID"
  );
});
