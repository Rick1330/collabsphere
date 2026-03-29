import assert from "node:assert/strict";
import test from "node:test";
import net from "node:net";

const postgresHost = process.env.POSTGRES_HOST ?? "127.0.0.1";
const postgresPort = Number.parseInt(process.env.POSTGRES_PORT ?? "5432", 10);
const redisHost = process.env.REDIS_HOST ?? "127.0.0.1";
const redisPort = Number.parseInt(process.env.REDIS_PORT ?? "6379", 10);
const retryDelayMs = 1000;
const maxAttempts = 20;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function openSocket(host, port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });

    socket.once("error", (error) => {
      socket.destroy();
      reject(error);
    });

    socket.once("connect", () => resolve(socket));
  });
}

function readOnce(socket) {
  return new Promise((resolve, reject) => {
    socket.once("data", (chunk) => resolve(chunk));
    socket.once("error", reject);
    socket.once("close", () => reject(new Error("socket closed before any data was received")));
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
