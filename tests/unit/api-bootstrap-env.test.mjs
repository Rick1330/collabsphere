import assert from "node:assert/strict";
import { once } from "node:events";
import { execFileSync, spawn } from "node:child_process";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const apiEntryPath = path.join(repoRoot, "apps", "api", "src", "dev.js");
const builtApiEntryPath = path.join(repoRoot, "apps", "api", "dist", "dev.js");

const validApiEnv = Object.freeze({
  HOST: "127.0.0.1",
  PORT: "0",
  DATABASE_URL: "postgresql://collab:collab@localhost:5432/collabsphere",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "replace-with-local-jwt-secret",
  JWT_ACCESS_TTL_MINUTES: "15",
  REFRESH_TOKEN_TTL_DAYS: "7",
  CORS_ORIGINS: "http://localhost:3000",
  EMAIL_PROVIDER_API_KEY: "replace-with-local-email-key",
  API_BASE_URL: "http://localhost:3001",
  BASE_URL: "http://localhost:3000",
});

const spawnApi = (envOverrides) =>
  spawn(process.execPath, [apiEntryPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

const spawnBuiltApi = (envOverrides) =>
  spawn(process.execPath, [builtApiEntryPath], {
    cwd: path.join(repoRoot, "apps", "api", "dist"),
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

const collectStream = (stream) => {
  let value = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    value += chunk;
  });
  return () => value;
};

const waitForListening = (child, stdoutText) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for API bootstrap readiness.\nstdout:\n${stdoutText()}`));
    }, 5000);

    child.stdout.on("data", () => {
      const match = stdoutText().match(/bootstrap listening on http:\/\/[^:]+:(\d+)\/api\/v1\/health/);
      if (!match) {
        return;
      }

      clearTimeout(timeout);
      resolve(Number.parseInt(match[1], 10));
    });

    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `API bootstrap exited before listening (code=${code}, signal=${signal}).\nstdout:\n${stdoutText()}`,
        ),
      );
    });
  });

const getJson = (port) =>
  new Promise((resolve, reject) => {
    const request = http.get(
      {
        host: "127.0.0.1",
        port,
        path: "/api/v1/health",
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            body: JSON.parse(body),
          });
        });
      },
    );

    request.once("error", reject);
  });

test("API bootstrap listens when required env is valid", async () => {
  const child = spawnApi(validApiEnv);
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);

  try {
    const port = await waitForListening(child, stdoutText);
    const response = await getJson(port);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body?.data?.resource?.service, "api");
    assert.equal(stderrText(), "");
  } finally {
    child.kill("SIGTERM");
    await once(child, "exit");
  }
});

test("API bootstrap fails fast with descriptive env validation errors", async () => {
  const child = spawnApi({
    ...validApiEnv,
    JWT_ACCESS_SECRET: undefined,
    CORS_ORIGINS: "not-a-url",
  });
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);

  const [code, signal] = await once(child, "exit");

  assert.equal(code, 1);
  assert.equal(signal, null);
  assert.equal(stdoutText(), "");
  assert.match(stderrText(), /\[api\] Environment validation failed/);
  assert.match(stderrText(), /JWT_ACCESS_SECRET: JWT_ACCESS_SECRET is required\./);
  assert.match(stderrText(), /CORS_ORIGINS: CORS_ORIGINS entries must be valid absolute URLs/);
  assert.doesNotMatch(stderrText(), /replace-with-local-jwt-secret/);
});

test("built API bootstrap artifact stays runnable without monorepo source imports", async () => {
  execFileSync(process.execPath, ["scripts/build-bootstrap-app.mjs", "apps/api"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  const child = spawnBuiltApi(validApiEnv);
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);

  try {
    const port = await waitForListening(child, stdoutText);
    const response = await getJson(port);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body?.data?.resource?.service, "api");
    assert.equal(stderrText(), "");
  } finally {
    child.kill("SIGTERM");
    await once(child, "exit");
  }
});
