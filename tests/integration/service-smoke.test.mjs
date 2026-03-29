import assert from "node:assert/strict";
import test from "node:test";
import net from "node:net";

const postgresHost = process.env.POSTGRES_HOST ?? "127.0.0.1";
const postgresPort = Number.parseInt(process.env.POSTGRES_PORT ?? "5432", 10);
const redisHost = process.env.REDIS_HOST ?? "127.0.0.1";
const redisPort = Number.parseInt(process.env.REDIS_PORT ?? "6379", 10);
const retryDelayMs = 1000;
const maxAttempts = 20;
const attemptTimeoutMs = 2000;

function validatePort(name, value) {
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`${name} must be a valid TCP port (1-65535), got: ${String(value)}`);
  }
}

validatePort("POSTGRES_PORT", postgresPort);
validatePort("REDIS_PORT", redisPort);

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
  await withRetries(`postgres at ${postgresHost}:${postgresPort}`, async () => {
    const socket = await openSocket(postgresHost, postgresPort);

    try {
      const sslRequest = Buffer.alloc(8);
      sslRequest.writeInt32BE(8, 0);
      sslRequest.writeInt32BE(80877103, 4);
      socket.write(sslRequest);

      const response = await readOnce(socket);
      assert.ok(response.length > 0, "postgres returned an empty response");
      assert.ok(
        response[0] === "S".charCodeAt(0) || response[0] === "N".charCodeAt(0),
        `postgres returned unexpected SSL negotiation response: ${response.toString("utf8")}`,
      );
    } finally {
      socket.end();
    }
  });
});

test("redis accepts ping commands", { timeout: 30_000 }, async () => {
  await withRetries(`redis at ${redisHost}:${redisPort}`, async () => {
    const socket = await openSocket(redisHost, redisPort);

    try {
      socket.write("*1\r\n$4\r\nPING\r\n");

      const response = await readOnce(socket);
      assert.match(
        response.toString("utf8"),
        /^\+PONG\r\n/,
        `redis returned unexpected PING response: ${response.toString("utf8")}`,
      );
    } finally {
      socket.end();
    }
  });
});
