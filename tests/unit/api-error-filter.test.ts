import assert from "node:assert/strict";
import test from "node:test";
import {
  AppError,
  createErrorResponse,
  ValidationAppError,
} from "../../apps/api/src/common/filters/app-error.filter.js";
import { createValidationErrorDetails } from "../../apps/api/src/common/errors/validation-errors.js";

test("validation issues are normalized to canonical detail objects", () => {
  assert.deepEqual(
    createValidationErrorDetails([
      {
        field: " title ",
        message: " Title is required ",
        rule: " isNotEmpty ",
      },
      {
        field: "",
        message: "",
      },
    ]),
    [
      {
        field: "title",
        message: "Title is required",
        rule: "isNotEmpty",
      },
      {
        field: "unknown",
        message: "Validation failed",
        rule: "invalid",
      },
    ],
  );
});

test("validation detail sanitization preserves field-name words like password", () => {
  const { payload } = createErrorResponse({
    error: new ValidationAppError({
      issues: [
        {
          field: "password",
          message: "Password is required",
          rule: "isNotEmpty",
        },
      ],
    }),
    requestId: "req_password",
    timestamp: "2026-04-24T00:00:00.000Z",
  });

  assert.deepEqual(payload.error.details, [
    {
      field: "password",
      message: "Password is required",
      rule: "isNotEmpty",
    },
  ]);
});

test("validation app errors return canonical validation envelopes", () => {
  const { statusCode, payload } = createErrorResponse({
    error: new ValidationAppError({
      issues: [
        {
          field: "title",
          message: "Title is required",
          rule: "isNotEmpty",
        },
      ],
    }),
    requestId: "req_validation",
    timestamp: "2026-04-24T00:00:00.000Z",
  });

  assert.equal(statusCode, 400);
  assert.deepEqual(payload, {
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: [
        {
          field: "title",
          message: "Title is required",
          rule: "isNotEmpty",
        },
      ],
      requestId: "req_validation",
      timestamp: "2026-04-24T00:00:00.000Z",
    },
  });
});

test("known app errors preserve safe client messages", () => {
  const { statusCode, payload } = createErrorResponse({
    error: new AppError({
      code: "NOT_FOUND",
      message: "No bootstrap route for GET /api/v1/missing",
    }),
    requestId: "req_not_found",
    timestamp: "2026-04-24T00:00:00.000Z",
  });

  assert.equal(statusCode, 404);
  assert.deepEqual(payload, {
    error: {
      code: "NOT_FOUND",
      message: "No bootstrap route for GET /api/v1/missing",
      requestId: "req_not_found",
      timestamp: "2026-04-24T00:00:00.000Z",
    },
  });
});

test("database-like unexpected errors are sanitized for clients", () => {
  const { statusCode, payload } = createErrorResponse({
    error: new Error(
      'PrismaClientKnownRequestError: SELECT * FROM "users" WHERE id = \'user_123\' failed',
    ),
    requestId: "req_db",
    timestamp: "2026-04-24T00:00:00.000Z",
  });

  assert.equal(statusCode, 500);
  assert.deepEqual(payload, {
    error: {
      code: "DATABASE_ERROR",
      message: "Database operation failed",
      requestId: "req_db",
      timestamp: "2026-04-24T00:00:00.000Z",
    },
  });
});

test("unknown unexpected errors fall back to INTERNAL_ERROR", () => {
  const { statusCode, payload } = createErrorResponse({
    error: new Error("kaboom"),
    requestId: "req_internal",
    timestamp: "2026-04-24T00:00:00.000Z",
  });

  assert.equal(statusCode, 500);
  assert.deepEqual(payload, {
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error",
      requestId: "req_internal",
      timestamp: "2026-04-24T00:00:00.000Z",
    },
  });
});

test("error response headers are allowlisted to Retry-After and WWW-Authenticate", () => {
  const { headers } = createErrorResponse({
    error: new AppError({
      code: "UNAUTHORIZED",
      headers: {
        "Retry-After": " 120 ",
        "www-authenticate": "Bearer realm=\"collabsphere\"",
        "Content-Type": "text/plain",
        "X-Custom": "ignored",
      },
    }),
    requestId: "req_headers",
    timestamp: "2026-04-25T00:00:00.000Z",
  });

  assert.deepEqual(headers, {
    "Retry-After": "120",
    "WWW-Authenticate": "Bearer realm=\"collabsphere\"",
  });
});
