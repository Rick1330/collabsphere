import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import path from "node:path";
import {
  assertBootstrapValidationFailure,
  collectStream,
  getJson,
  repoRoot,
  spawnBootstrap,
  stopChild,
  waitForStdoutMatch,
} from "./bootstrap-test-helpers.mjs";

const collabEntryPath = path.join(repoRoot, "apps", "collab", "src", "dev.js");
const builtCollabEntryPath = path.join(repoRoot, "apps", "collab", "dist", "dev.js");
const workerEntryPath = path.join(repoRoot, "apps", "worker", "src", "dev.js");
const builtWorkerEntryPath = path.join(repoRoot, "apps", "worker", "dist", "dev.js");

const validRuntimeEnv = Object.freeze({
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
  COLLAB_DATABASE_URL: "postgresql://collab:collab@localhost:5432/collabsphere",
  COLLAB_REDIS_URL: "redis://localhost:6379",
  COLLAB_JWT_SECRET: "replace-with-local-collab-secret",
  COLLAB_WS_URL: "ws://localhost:3001/collaboration",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "collabsphere-local",
  S3_ACCESS_KEY_ID: "minioadmin",
  S3_SECRET_ACCESS_KEY: "minioadmin",
  S3_REGION: "us-east-1",
});

const spawnCollab = (envOverrides) =>
  spawnBootstrap({ entryPath: collabEntryPath, cwd: repoRoot, envOverrides });

const spawnBuiltCollab = (envOverrides) =>
  spawnBootstrap({
    entryPath: builtCollabEntryPath,
    cwd: path.join(repoRoot, "apps", "collab", "dist"),
    envOverrides,
  });

const spawnWorker = (envOverrides) =>
  spawnBootstrap({ entryPath: workerEntryPath, cwd: repoRoot, envOverrides });

const spawnBuiltWorker = (envOverrides) =>
  spawnBootstrap({
    entryPath: builtWorkerEntryPath,
    cwd: path.join(repoRoot, "apps", "worker", "dist"),
    envOverrides,
  });

const assertCollabBootstrapHealthy = async (spawnFn) => {
  const child = spawnFn(validRuntimeEnv);
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);

  try {
    const match = await waitForStdoutMatch(
      child,
      stdoutText,
      /bootstrap listening on http:\/\/[^:]+:(\d+)/,
      "collab bootstrap readiness",
    );
    const response = await getJson(Number.parseInt(match[1], 10));

    assert.equal(response.statusCode, 200);
    assert.equal(response.body?.service, "collab");
    assert.equal(response.body?.status, "ok");
    assert.equal(stderrText(), "");
  } finally {
    await stopChild(child);
  }
};

const assertWorkerBootstrapHealthy = async (spawnFn) => {
  const child = spawnFn({
    ...validRuntimeEnv,
    WORKER_HEARTBEAT_MS: "1500",
  });
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);

  try {
    const match = await waitForStdoutMatch(
      child,
      stdoutText,
      /\[worker\] heartbeat interval (\d+)ms/,
      "worker bootstrap readiness",
    );

    assert.equal(Number.parseInt(match[1], 10), 1500);
    assert.match(stdoutText(), /\[worker\] bootstrap started/);
    assert.equal(stderrText(), "");
  } finally {
    await stopChild(child);
  }
};

test("collab bootstrap listens when shared env is valid", async () => {
  await assertCollabBootstrapHealthy(spawnCollab);
});

test("collab bootstrap fails fast with descriptive env validation errors", async () => {
  await assertBootstrapValidationFailure({
    spawnFn: spawnCollab,
    envOverrides: {
      ...validRuntimeEnv,
      COLLAB_JWT_SECRET: undefined,
    },
    service: "collab",
    expectedMessages: [/COLLAB_JWT_SECRET: COLLAB_JWT_SECRET is required\./],
    forbiddenPatterns: [/replace-with-local-collab-secret/],
  });
});

test("built collab bootstrap artifact stays runnable without monorepo source imports", async () => {
  execFileSync(process.execPath, ["scripts/build-bootstrap-app.mjs", "apps/collab"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  await assertCollabBootstrapHealthy(spawnBuiltCollab);
});

test("worker bootstrap starts when shared env is valid", async () => {
  await assertWorkerBootstrapHealthy(spawnWorker);
});

test("worker bootstrap fails fast with descriptive env validation errors", async () => {
  await assertBootstrapValidationFailure({
    spawnFn: spawnWorker,
    envOverrides: {
      ...validRuntimeEnv,
      S3_BUCKET: undefined,
    },
    service: "worker",
    expectedMessages: [/S3_BUCKET: S3_BUCKET is required\./],
    forbiddenPatterns: [/minioadmin/],
  });
});

test("built worker bootstrap artifact stays runnable without monorepo source imports", async () => {
  execFileSync(process.execPath, ["scripts/build-bootstrap-app.mjs", "apps/worker"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  await assertWorkerBootstrapHealthy(spawnBuiltWorker);
});
