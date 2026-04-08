import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthApiError,
  logoutCurrentSession,
} from "../../apps/web/src/lib/api/auth";

test("logoutCurrentSession classifies network failures safely", async () => {
  const fetchFn: typeof fetch = async () => {
    throw new TypeError("fetch failed");
  };

  await assert.rejects(
    () => logoutCurrentSession({ fetchFn }),
    (error) =>
      error instanceof AuthApiError &&
      error.kind === "network" &&
      error.message === "Sign out could not reach the server. Check the connection and retry.",
  );
});

test("logoutCurrentSession preserves request ids on server failures", async () => {
  const fetchFn: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        meta: {
          requestId: "req_logout_failure",
        },
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );

  await assert.rejects(
    () => logoutCurrentSession({ fetchFn }),
    (error) =>
      error instanceof AuthApiError &&
      error.kind === "server" &&
      error.requestId === "req_logout_failure" &&
      error.message === "Sign out could not be completed. Retry in a moment.",
  );
});
