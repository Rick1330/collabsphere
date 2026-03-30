import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
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

const cleanupTempBuildDir = () => {
  rmSync(tempBuildDir, { force: true, recursive: true });
};

const compileSharedEnvModule = () => {
  cleanupTempBuildDir();
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

  copyFileSync(
    path.join(repoRoot, "packages", "shared", "src", "api-env.js"),
    path.join(tempBuildDir, "api-env.js"),
  );

  copyFileSync(
    path.join(repoRoot, "packages", "shared", "src", "env-core.js"),
    path.join(tempBuildDir, "env-core.js"),
  );

  return pathToFileURL(path.join(tempBuildDir, "env.js")).href;
};

let sharedEnvModule;

try {
  const buildUrl = compileSharedEnvModule();
  sharedEnvModule = await import(`${buildUrl}?t=${Date.now()}`);
} catch (error) {
  cleanupTempBuildDir();
  throw error;
}

test.after(() => {
  cleanupTempBuildDir();
});

const {
  EnvValidationError,
  parseApiRuntimeEnv,
  parseEnv,
  parseRuntimeEnv,
  sanitizeEnv,
} = sharedEnvModule;

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
  const parsed = parseRuntimeEnv(validEnv);

  assert.equal(parsed.JWT_ACCESS_TTL_MINUTES, 15);
  assert.equal(parsed.REFRESH_TOKEN_TTL_DAYS, 7);
  assert.deepEqual(parsed.CORS_ORIGINS, [
    "http://localhost:3000",
    "http://localhost:3002",
  ]);
  assert.equal(parsed.COLLAB_REDIS_URL, "redis://localhost:6379");
  assert.equal(parsed.S3_ENDPOINT, "http://localhost:9000");
});

test("shared env parser ignores unrelated env keys when validating runtime input", () => {
  const parsed = parseRuntimeEnv({
    ...validEnv,
    POSTGRES_DB: "collabsphere",
    MINIO_ROOT_PASSWORD: "minioadmin",
  });

  assert.equal(parsed.DATABASE_URL, validEnv.DATABASE_URL);
  assert.equal(parsed.S3_BUCKET, validEnv.S3_BUCKET);
});

test("API runtime parser accepts the API bootstrap subset without collab or storage keys", () => {
  const parsed = parseApiRuntimeEnv({
    DATABASE_URL: validEnv.DATABASE_URL,
    REDIS_URL: validEnv.REDIS_URL,
    JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET,
    JWT_ACCESS_TTL_MINUTES: validEnv.JWT_ACCESS_TTL_MINUTES,
    REFRESH_TOKEN_TTL_DAYS: validEnv.REFRESH_TOKEN_TTL_DAYS,
    CORS_ORIGINS: validEnv.CORS_ORIGINS,
    EMAIL_PROVIDER_API_KEY: validEnv.EMAIL_PROVIDER_API_KEY,
    API_BASE_URL: validEnv.API_BASE_URL,
    BASE_URL: validEnv.BASE_URL,
  });

  assert.equal(parsed.DATABASE_URL, validEnv.DATABASE_URL);
  assert.equal(parsed.API_BASE_URL, validEnv.API_BASE_URL);
  assert.deepEqual(parsed.CORS_ORIGINS, [
    "http://localhost:3000",
    "http://localhost:3002",
  ]);
});

test("shared env parser fails clearly for missing required keys", () => {
  assert.throws(
    () => parseRuntimeEnv({ ...validEnv, JWT_ACCESS_SECRET: undefined }),
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
      parseRuntimeEnv({
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
  const rawEnv = parseRuntimeEnv(validEnv);
  const sanitized = sanitizeEnv(rawEnv);

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

test("sanitizeEnv strips query and hash from credential URLs", () => {
  const rawEnv = parseRuntimeEnv({
    ...validEnv,
    REDIS_URL: "redis://:secret@localhost:6379/0?token=abc#frag",
  });

  const sanitized = sanitizeEnv(rawEnv);

  assert.equal(sanitized.REDIS_URL, "redis://[redacted]@localhost:6379/0");
});

test("sanitizeEnv strips query and hash from non-credential URLs", () => {
  const rawEnv = parseRuntimeEnv({
    ...validEnv,
    REDIS_URL: "redis://localhost:6379/0?token=abc#frag",
  });

  const sanitized = sanitizeEnv(rawEnv);

  assert.equal(sanitized.REDIS_URL, "redis://localhost:6379/0");
});

test("parseEnv returns the sanitized shared env surface by default", () => {
  const parsed = parseEnv(validEnv);

  assert.equal(parsed.JWT_ACCESS_SECRET, "[redacted]");
  assert.equal(parsed.EMAIL_PROVIDER_API_KEY, "[redacted]");
  assert.equal(parsed.S3_SECRET_ACCESS_KEY, "[redacted]");
  assert.equal(
    parsed.COLLAB_DATABASE_URL,
    "postgresql://[redacted]@localhost:5432/collabsphere",
  );
});

test("sanitizeEnv handles undefined optional URLs", () => {
  const envWithoutOptionalRedis = { ...validEnv };
  delete envWithoutOptionalRedis.COLLAB_REDIS_URL;
  delete envWithoutOptionalRedis.S3_ENDPOINT;

  const sanitized = parseEnv(envWithoutOptionalRedis);

  assert.equal(sanitized.COLLAB_REDIS_URL, undefined);
  assert.equal(sanitized.S3_ENDPOINT, undefined);
});
