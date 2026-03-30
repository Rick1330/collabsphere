import assert from "node:assert/strict";
import test from "node:test";
import net from "node:net";

import { createServiceSmokeFixtures } from "./fixtures/index.mjs";

const fixtures = createServiceSmokeFixtures();
const {
  metadata,
  services: { postgres, redis },
  timing: { retryDelayMs, maxAttempts, attemptTimeoutMs },
} = fixtures;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function openSocket(host, port, timeoutMs = attemptTimeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("error", onError);
      socket.off("timeout", onTimeout);
    };

    const onConnect = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      socket.setTimeout(0);
      resolve(socket);
    };

    const onError = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      socket.destroy();
      reject(error);
    };

    const onTimeout = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      socket.destroy();
      reject(new Error(`connection to ${host}:${port} timed out after ${timeoutMs}ms`));
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", onConnect);
    socket.once("error", onError);
    socket.once("timeout", onTimeout);
  });
}

function readOnce(socket, timeoutMs = attemptTimeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
      socket.off("timeout", onTimeout);
    };

    const onData = (chunk) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      socket.setTimeout(0);
      resolve(chunk);
    };

    const onError = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      socket.setTimeout(0);
      reject(error);
    };

    const onClose = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      socket.setTimeout(0);
      reject(new Error("socket closed before any data was received"));
    };

    const onTimeout = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      socket.setTimeout(0);
      reject(new Error(`socket read timed out after ${timeoutMs}ms`));
    };

    socket.setTimeout(timeoutMs);
    socket.once("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
    socket.once("timeout", onTimeout);
  });
}

async function withRetries(label, action) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        await sleep(retryDelayMs);
      }
    }
  }

  throw new Error(`${label} did not become ready after ${maxAttempts} attempts: ${lastError.message}`);
}

test("postgres accepts startup handshakes", { timeout: 30_000 }, async () => {
  await withRetries(`${metadata.suiteId}:${postgres.id}:${postgres.label}`, async () => {
    const socket = await openSocket(postgres.host, postgres.port);

    try {
      socket.write(postgres.sslRequest);

      const response = await readOnce(socket);
      assert.ok(response.length > 0, "postgres returned an empty response");
      assert.ok(
        postgres.acceptedResponses.includes(response[0]),
        `postgres returned unexpected SSL negotiation response: ${response.toString("utf8")}`,
      );
    } finally {
      socket.end();
    }
  });
});

test("redis accepts ping commands", { timeout: 30_000 }, async () => {
  await withRetries(`${metadata.suiteId}:${redis.id}:${redis.label}`, async () => {
    const socket = await openSocket(redis.host, redis.port);

    try {
      socket.write(redis.pingCommand);

      const response = await readOnce(socket);
      assert.match(
        response.toString("utf8"),
        redis.expectedResponse,
        `redis returned unexpected PING response: ${response.toString("utf8")}`,
      );
    } finally {
      socket.end();
    }
  });
});
