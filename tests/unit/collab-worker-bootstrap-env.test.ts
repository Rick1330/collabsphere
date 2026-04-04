import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import path from "node:path";
import {
  assertBootstrapValidationFailure,
  collectStream,
  getJson,
  repoRoot,
  runTsc,
  spawnBootstrap,
  stopChild,
  waitForStdoutMatch,
} from "./bootstrap-test-helpers.ts";

const collabEntryPath = path.join(repoRoot, "apps", "collab", "src", "dev.ts");
const builtCollabEntryPath = path.join(repoRoot, "apps", "collab", "dist", "dev.js");
const workerEntryPath = path.join(repoRoot, "apps", "worker", "src", "dev.ts");
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

const spawnCollab = (envOverrides: NodeJS.ProcessEnv) =>
  spawnBootstrap({ entryPath: collabEntryPath, cwd: repoRoot, envOverrides });

const spawnBuiltCollab = (envOverrides: NodeJS.ProcessEnv) =>
  spawnBootstrap({
    entryPath: builtCollabEntryPath,
    cwd: path.join(repoRoot, "apps", "collab", "dist"),
    envOverrides,
  });

const spawnWorker = (envOverrides: NodeJS.ProcessEnv) =>
  spawnBootstrap({ entryPath: workerEntryPath, cwd: repoRoot, envOverrides });

const spawnBuiltWorker = (envOverrides: NodeJS.ProcessEnv) =>
  spawnBootstrap({
    entryPath: builtWorkerEntryPath,
    cwd: path.join(repoRoot, "apps", "worker", "dist"),
    envOverrides,
  });

const assertBootstrapHealthy = async ({
  spawnFn,
  healthyEnv,
  readinessPattern,
  readinessDescription,
  assertReady,
}: {
  spawnFn: (envOverrides: NodeJS.ProcessEnv) => ReturnType<typeof spawnBootstrap>;
  healthyEnv: NodeJS.ProcessEnv;
  readinessPattern: RegExp;
  readinessDescription: string;
  assertReady: (input: {
    match: RegExpMatchArray;
    stdoutText: () => string;
    stderrText: () => string;
  }) => Promise<void>;
}) => {
  const child = spawnFn(healthyEnv);
  const stdoutText = collectStream(child.stdout);
  const stderrText = collectStream(child.stderr);

  try {
    const match = await waitForStdoutMatch(child, stdoutText, readinessPattern, readinessDescription);
    await assertReady({ match, stdoutText, stderrText });
    assert.equal(stderrText(), "");
  } finally {
    await stopChild(child);
  }
};

const serviceSpecs = [
  {
    name: "collab",
    buildAppPath: "apps/collab",
    spawnFn: spawnCollab,
    spawnBuiltFn: spawnBuiltCollab,
    healthyEnv: validRuntimeEnv,
    invalidEnv: {
      ...validRuntimeEnv,
      COLLAB_JWT_SECRET: undefined,
    },
    expectedMessages: [/COLLAB_JWT_SECRET: COLLAB_JWT_SECRET is required\./],
    forbiddenPatterns: [/replace-with-local-collab-secret/],
    readinessPattern: /bootstrap listening on http:\/\/[^:]+:(\d+)/,
    readinessDescription: "collab bootstrap readiness",
    assertReady: async ({ match }: { match: RegExpMatchArray }) => {
      const response = await getJson(Number.parseInt(match[1], 10));
      const body = response.body as { service?: string; status?: string };

      assert.equal(response.statusCode, 200);
      assert.equal(body.service, "collab");
      assert.equal(body.status, "ok");
    },
  },
  {
    name: "worker",
    buildAppPath: "apps/worker",
    spawnFn: spawnWorker,
    spawnBuiltFn: spawnBuiltWorker,
    healthyEnv: {
      ...validRuntimeEnv,
      WORKER_HEARTBEAT_MS: "1500",
    },
    invalidEnv: {
      ...validRuntimeEnv,
      S3_BUCKET: undefined,
    },
    expectedMessages: [/S3_BUCKET: S3_BUCKET is required\./],
    forbiddenPatterns: [/minioadmin/],
    readinessPattern: /\[worker\] heartbeat interval (\d+)ms/,
    readinessDescription: "worker bootstrap readiness",
    assertReady: async ({
      match,
      stdoutText,
    }: {
      match: RegExpMatchArray;
      stdoutText: () => string;
    }) => {
      assert.equal(Number.parseInt(match[1], 10), 1500);
      assert.match(stdoutText(), /\[worker\] bootstrap started/);
    },
  },
];

for (const service of serviceSpecs) {
  test(`${service.name} bootstrap starts when shared env is valid`, async () => {
    await assertBootstrapHealthy(service);
  });

  test(`${service.name} bootstrap fails fast with descriptive env validation errors`, async () => {
    await assertBootstrapValidationFailure({
      spawnFn: service.spawnFn,
      envOverrides: service.invalidEnv,
      service: service.name,
      expectedMessages: service.expectedMessages,
      forbiddenPatterns: service.forbiddenPatterns,
    });
  });

  test(`built ${service.name} bootstrap artifact stays runnable without monorepo source imports`, async () => {
    runTsc(path.join(repoRoot, service.buildAppPath, "tsconfig.json"));
    execFileSync(process.execPath, ["scripts/build-bootstrap-app.mjs", service.buildAppPath], {
      cwd: repoRoot,
      stdio: "inherit",
    });

    await assertBootstrapHealthy({
      ...service,
      spawnFn: service.spawnBuiltFn,
    });
  });
}
