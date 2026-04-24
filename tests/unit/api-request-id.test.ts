import assert from "node:assert/strict";
import test from "node:test";
import {
  createRequestId,
  isValidIncomingRequestId,
  resolveRequestId,
} from "../../apps/api/src/common/middleware/request-id.middleware.js";
import {
  getRequestContext,
  getRequestId,
  runWithRequestContext,
} from "../../apps/api/src/common/request-context.js";

test("request-id generator emits req_ prefixed ULIDs", () => {
  const requestId = createRequestId();

  assert.match(requestId, /^req_[0-9A-HJKMNP-TV-Z]{26}$/);
});

test("request-id resolution preserves valid incoming headers and replaces invalid ones", () => {
  assert.equal(resolveRequestId("req_client_trace_123"), "req_client_trace_123");
  assert.equal(isValidIncomingRequestId("req_client_trace_123"), true);
  assert.equal(isValidIncomingRequestId("invalid request id"), false);
  assert.equal(isValidIncomingRequestId(undefined), false);

  const generated = resolveRequestId("invalid request id");
  assert.match(generated, /^req_[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.notEqual(generated, "invalid request id");
});

test("request context survives async boundaries", async () => {
  const result = await runWithRequestContext(
    {
      requestId: "req_context_123",
      method: "GET",
      path: "/api/v1/health",
      ip: "127.0.0.1",
      userAgent: "unit-test",
    },
    async () => {
      await Promise.resolve();

      return {
        requestId: getRequestId(),
        context: getRequestContext(),
      };
    },
  );

  assert.equal(result.requestId, "req_context_123");
  assert.deepEqual(result.context, {
    requestId: "req_context_123",
    method: "GET",
    path: "/api/v1/health",
    ip: "127.0.0.1",
    userAgent: "unit-test",
  });
});
