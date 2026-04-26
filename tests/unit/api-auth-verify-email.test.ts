import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import test from "node:test";
import { AppError } from "../../apps/api/src/common/filters/app-error.filter.js";
import { createAuthController } from "../../apps/api/src/auth/auth.controller.js";
import {
  createVerifyEmailService,
  registerServiceConstants,
} from "../../apps/api/src/auth/auth.service.js";
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

  const repository: VerifyEmailRepository = {
    findEmailVerificationByHash: async (tokenHash) => recordsByHash.get(tokenHash) ?? null,
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
  };
};

const createVerifyEmailServiceUnderTest = (repository: VerifyEmailRepository) =>
  createVerifyEmailService({
    repository,
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

  const service = createVerifyEmailService({
    repository: repo.repository,
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
      token: ` ${rawToken} `,
    }),
  });

  assert.equal(result.message, registerServiceConstants.verifyEmailSuccessMessage);
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
});

test("verify email service returns TOKEN_INVALID for an unknown token", async () => {
  const repo = createVerifyEmailRepositoryDouble();
  const service = createVerifyEmailServiceUnderTest(repo.repository);

  await assert.rejects(
    service.verifyEmail({
      payload: validateVerifyEmailInput({
        token: "missing-token",
      }),
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
  ] as const;

  for (const scenario of scenarios) {
    const repo = createVerifyEmailRepositoryDouble();
    addVerificationRecord({
      repo,
      rawToken: scenario.rawToken,
      record: scenario.record,
    });

    if (scenario.consumeFailureTokenId) {
      repo.consumeFailures.add(scenario.consumeFailureTokenId);
    }

    const service = createVerifyEmailServiceUnderTest(repo.repository);

    await assert.rejects(
      service.verifyEmail({
        payload: validateVerifyEmailInput({
          token: scenario.rawToken,
        }),
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
        return { message: registerServiceConstants.verifyEmailSuccessMessage };
      },
    },
  });

  const result = await controller.verifyEmail({
    request: createJsonRequest({
      body: {
        token: "  token-value  ",
      },
    }),
  });

  assert.equal(result.message, registerServiceConstants.verifyEmailSuccessMessage);
  assert.deepEqual(capturedPayload, {
    token: "token-value",
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

test("verify email DTO rejects tokens exceeding the maximum allowed length", () => {
  const oversizedToken = "a".repeat(513);

  assert.throws(
    () =>
      validateVerifyEmailInput({
        token: oversizedToken,
      }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});
