import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const tempBuildDir = path.join(
  repoRoot,
  "packages",
  "shared",
  ".tmp",
  "unit-tests",
  "shared-env",
);
const tscPath = require.resolve("typescript/bin/tsc");

const compileSharedEnvModule = () => {
  rmSync(tempBuildDir, { force: true, recursive: true });
  mkdirSync(tempBuildDir, { recursive: true });

  execFileSync(
    process.execPath,
    [
      tscPath,
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--strict",
      "--skipLibCheck",
      "--esModuleInterop",
      "--allowSyntheticDefaultImports",
      "--verbatimModuleSyntax",
      "--rootDir",
      path.join("packages", "shared", "src"),
      "--outDir",
      tempBuildDir,
      path.join("packages", "shared", "src", "env.schema.ts"),
      path.join("packages", "shared", "src", "env.ts"),
      path.join("packages", "shared", "src", "index.ts"),
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  return pathToFileURL(path.join(tempBuildDir, "env.js")).href;
};

const buildUrl = compileSharedEnvModule();
const sharedEnvModule = await import(`${buildUrl}?t=${Date.now()}`);

const { EnvValidationError, parseEnv, sanitizeEnv } = sharedEnvModule;

const validEnv = Object.freeze({
  DATABASE_URL: "postgresql://collab:collab@localhost:5432/collabsphere",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "replace-with-local-jwt-secret",
  JWT_ACCESS_TTL_MINUTES: "15",
  REFRESH_TOKEN_TTL_DAYS: "7",
  CORS_ORIGINS: "http://localhost:3000, http://localhost:3002",
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

test("shared env parser accepts valid input and normalizes typed values", () => {
  const parsed = parseEnv(validEnv);

  assert.equal(parsed.JWT_ACCESS_TTL_MINUTES, 15);
  assert.equal(parsed.REFRESH_TOKEN_TTL_DAYS, 7);
  assert.deepEqual(parsed.CORS_ORIGINS, [
    "http://localhost:3000",
    "http://localhost:3002",
  ]);
  assert.equal(parsed.COLLAB_REDIS_URL, "redis://localhost:6379");
  assert.equal(parsed.S3_ENDPOINT, "http://localhost:9000");
});

test("shared env parser fails clearly for missing required keys", () => {
  assert.throws(
    () => parseEnv({ ...validEnv, JWT_ACCESS_SECRET: undefined }),
    (error) => {
      assert.ok(error instanceof EnvValidationError);
      assert.match(error.message, /Review \.env\.example/);
      assert.deepEqual(error.issues, [
        {
          key: "JWT_ACCESS_SECRET",
          message: "JWT_ACCESS_SECRET is required.",
        },
      ]);
      return true;
    },
  );
});

test("shared env parser fails clearly for invalid values", () => {
  assert.throws(
    () =>
      parseEnv({
        ...validEnv,
        JWT_ACCESS_TTL_MINUTES: "15m",
        CORS_ORIGINS: "not-a-url",
        COLLAB_WS_URL: "http://localhost:3001/collaboration",
      }),
    (error) => {
      assert.ok(error instanceof EnvValidationError);
      assert.ok(
        error.issues.some((issue) => issue.key === "JWT_ACCESS_TTL_MINUTES"),
      );
      assert.ok(error.issues.some((issue) => issue.key === "CORS_ORIGINS"));
      assert.ok(error.issues.some((issue) => issue.key === "COLLAB_WS_URL"));
      return true;
    },
  );
});

test("sanitizeEnv redacts secrets and URL credentials without losing safe fields", () => {
  const sanitized = sanitizeEnv(parseEnv(validEnv));

  assert.equal(
    sanitized.DATABASE_URL,
    "postgresql://[redacted]@localhost:5432/collabsphere",
  );
  assert.equal(sanitized.REDIS_URL, "redis://localhost:6379");
  assert.equal(sanitized.JWT_ACCESS_SECRET, "[redacted]");
  assert.equal(sanitized.EMAIL_PROVIDER_API_KEY, "[redacted]");
  assert.equal(sanitized.S3_ACCESS_KEY_ID, "[redacted]");
  assert.equal(sanitized.S3_SECRET_ACCESS_KEY, "[redacted]");
  assert.deepEqual(sanitized.CORS_ORIGINS, [
    "http://localhost:3000",
    "http://localhost:3002",
  ]);
});
