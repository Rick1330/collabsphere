import assert from "node:assert/strict";
import test from "node:test";

import {
  createActionResponseEnvelope,
  createListResponseEnvelope,
  createSingleResourceEnvelope,
} from "../../apps/api/src/common/response/response-envelope.js";
import {
  createActionResponsePayload,
  createListResponsePayload,
  createSingleResourcePayload,
  wrapSuccessResponse,
} from "../../apps/api/src/common/interceptors/response-envelope.interceptor.js";

test("single-resource envelopes use the canonical data.resource shape", () => {
  assert.deepEqual(
    createSingleResourceEnvelope({
      resource: { id: "user_123" },
      requestId: "req_123",
    }),
    {
      data: {
        resource: { id: "user_123" },
      },
      meta: {
        requestId: "req_123",
      },
    },
  );
});

test("list envelopes preserve total and pagination meta", () => {
  assert.deepEqual(
    createListResponseEnvelope({
      items: [{ id: "task_123" }],
      total: 1,
      requestId: "req_123",
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
    {
      data: {
        items: [{ id: "task_123" }],
        total: 1,
      },
      meta: {
        requestId: "req_123",
        pagination: {
          page: 1,
          pageSize: 25,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  );
});

test("action envelopes keep the message inside data", () => {
  assert.deepEqual(
    createActionResponseEnvelope({
      message: "OK",
      requestId: "req_123",
    }),
    {
      data: {
        message: "OK",
      },
      meta: {
        requestId: "req_123",
      },
    },
  );
});

test("action envelopes do not let extraData override the canonical message", () => {
  assert.deepEqual(
    createActionResponseEnvelope({
      message: "OK",
      requestId: "req_123",
      extraData: {
        status: "queued",
      },
    }),
    {
      data: {
        status: "queued",
        message: "OK",
      },
      meta: {
        requestId: "req_123",
      },
    },
  );
});

test("success wrapper maps single, list, and action payloads to canonical envelopes", () => {
  assert.deepEqual(
    wrapSuccessResponse({
      payload: createSingleResourcePayload({ id: "workspace_123" }),
      requestId: "req_single",
    }),
    {
      data: {
        resource: { id: "workspace_123" },
      },
      meta: {
        requestId: "req_single",
      },
    },
  );

  assert.deepEqual(
    wrapSuccessResponse({
      payload: createListResponsePayload({
        items: [{ id: "doc_123" }],
        total: 1,
        pagination: {
          page: 1,
          pageSize: 25,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      requestId: "req_list",
    }),
    {
      data: {
        items: [{ id: "doc_123" }],
        total: 1,
      },
      meta: {
        requestId: "req_list",
        pagination: {
          page: 1,
          pageSize: 25,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  );

  assert.deepEqual(
    wrapSuccessResponse({
      payload: createActionResponsePayload({
        message: "OK",
      }),
      requestId: "req_action",
    }),
    {
      data: {
        message: "OK",
      },
      meta: {
        requestId: "req_action",
      },
    },
  );
});
