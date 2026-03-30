import assert from "node:assert/strict";
import { once } from "node:events";
import { execFileSync } from "node:child_process";
import test from "node:test";
import path from "node:path";
import {
  collectStream,
  getJson,
  repoRoot,
  spawnBootstrap,
  stopChild,
  waitForStdoutMatch,
} from "./bootstrap-test-helpers.mjs";

const apiEntryPath = path.join(repoRoot, "apps", "api", "src", "dev.ts");
const builtApiEntryPath = path.join(repoRoot, "apps", "api", "dist", "dev.js");
const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const runTsc = (projectPath) => {
  execFileSync(pnpmCmd, ["exec", "tsc", "-p", projectPath], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};

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
  spawnBootstrap({ entryPath: apiEntryPath, cwd: repoRoot, envOverrides });

const spawnBuiltApi = (envOverrides) =>
  spawnBootstrap({
    entryPath: builtApiEntryPath,
    cwd: path.join(repoRoot, "apps", "api", "dist"),
    envOverrides,
  });

const assertBootstrapHealthy = async (spawnBootstrap) => {
  const child = spawnBootstrap(validApiEnv);
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);

  try {
    const match = await waitForStdoutMatch(
      child,
      stdoutText,
      /bootstrap listening on http:\/\/[^:]+:(\d+)\/api\/v1\/health/,
      "API bootstrap readiness",
    );
    const response = await getJson(Number.parseInt(match[1], 10), "/api/v1/health");

    assert.equal(response.statusCode, 200);
    assert.equal(response.body?.data?.resource?.service, "api");
    assert.equal(stderrText(), "");
  } finally {
    await stopChild(child);
  }
};

test("API bootstrap listens when required env is valid", async () => {
  await assertBootstrapHealthy(spawnApi);
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
  assert.match(stderrText(), /CORS_ORIGINS: CORS_ORIGINS entry 1 must be a valid absolute origin\./);
  assert.doesNotMatch(stderrText(), /replace-with-local-jwt-secret/);
});

test("built API bootstrap artifact stays runnable without monorepo source imports", async () => {
  runTsc(path.join(repoRoot, "apps", "api", "tsconfig.json"));
  execFileSync(process.execPath, ["scripts/build-bootstrap-app.mjs", "apps/api"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  await assertBootstrapHealthy(spawnBuiltApi);
});
