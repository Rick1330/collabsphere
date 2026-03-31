import assert from "node:assert/strict";
import { once } from "node:events";
import { execFileSync } from "node:child_process";
import net from "node:net";
import test from "node:test";
import path from "node:path";
import {
  collectStream,
  getJson,
  repoRoot,
  runTsc,
  spawnBootstrap,
  stopChild,
  waitForStdoutMatch,
} from "./bootstrap-test-helpers.mjs";

const apiEntryPath = path.join(repoRoot, "apps", "api", "src", "dev.ts");
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
  spawnBootstrap({ entryPath: apiEntryPath, cwd: repoRoot, envOverrides });

const spawnBuiltApi = (envOverrides) =>
  spawnBootstrap({
    entryPath: builtApiEntryPath,
    cwd: path.join(repoRoot, "apps", "api", "dist"),
    envOverrides,
  });

const postgresSslResponseBuffer = Buffer.from("S");
const redisExpectedPing = "*1\r\n$4\r\nPING\r\n";
const redisPongBuffer = Buffer.from("+PONG\r\n");

const closeServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const createMockDependencyServer = async (onData) => {
  const server = net.createServer((socket) => {
    socket.once("data", (chunk) => onData(chunk, socket));
    socket.once("error", () => {});
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert.ok(address && typeof address === "object");

  return {
    server,
    port: address.port,
  };
};

const createMockPostgresServer = () =>
  createMockDependencyServer((_, socket) => {
    socket.write(postgresSslResponseBuffer);
    socket.end();
  });

const createMockRedisServer = () =>
  createMockDependencyServer((chunk, socket) => {
    const payload = chunk.toString("utf8");

    if (payload.startsWith(redisExpectedPing)) {
      socket.write(redisPongBuffer);
    }

    socket.end();
  });

const withOccupiedPort = async (callback) => {
  const blocker = net.createServer((socket) => {
    socket.destroy();
  });

  blocker.listen(0, "127.0.0.1");
  await once(blocker, "listening");

  const address = blocker.address();
  assert.ok(address && typeof address === "object");

  try {
    await callback(address.port);
  } finally {
    await closeServer(blocker);
  }
};

const withMockDependencies = async (callback) => {
  const postgres = await createMockPostgresServer();
  const redis = await createMockRedisServer();

  try {
    await callback({
      DATABASE_URL: `postgresql://collab:collab@127.0.0.1:${postgres.port}/collabsphere`,
      REDIS_URL: `redis://127.0.0.1:${redis.port}`,
    });
  } finally {
    await Promise.allSettled([closeServer(postgres.server), closeServer(redis.server)]);
  }
};

const getBootstrapHealthResponse = async ({
  spawn = spawnApi,
  envOverrides = validApiEnv,
} = {}) => {
  const child = spawn(envOverrides);
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

    return {
      response,
      stderr: stderrText(),
    };
  } finally {
    await stopChild(child);
  }
};

const assertHealthyBootstrap = async (options = {}) => {
  const { response, stderr } = await getBootstrapHealthResponse(options);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body?.data?.resource?.service, "api");
  assert.equal(response.body?.data?.resource?.status, "healthy");
  assert.equal(response.body?.data?.resource?.checks?.database?.status, "healthy");
  assert.equal(response.body?.data?.resource?.checks?.redis?.status, "healthy");
  assert.match(response.body?.meta?.requestId ?? "", /^req_/);
  assert.equal(stderr, "");
};

test("API bootstrap listens when required env is valid", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await assertHealthyBootstrap({
      envOverrides: {
        ...validApiEnv,
        ...dependencyEnv,
      },
    });
  });
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

test("API bootstrap accepts SMTP-only local email configuration", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await assertHealthyBootstrap({
      envOverrides: {
        ...validApiEnv,
        ...dependencyEnv,
        EMAIL_PROVIDER_API_KEY: undefined,
        EMAIL_SMTP_HOST: "127.0.0.1",
        EMAIL_SMTP_PORT: "1025",
      },
    });
  });
});

test("built API bootstrap artifact stays runnable without monorepo source imports", async () => {
  runTsc(path.join(repoRoot, "apps", "api", "tsconfig.json"));
  execFileSync(process.execPath, ["scripts/build-bootstrap-app.mjs", "apps/api"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  await withMockDependencies(async (dependencyEnv) => {
    await assertHealthyBootstrap({
      spawn: spawnBuiltApi,
      envOverrides: {
        ...validApiEnv,
        ...dependencyEnv,
      },
    });
  });
});

test("health endpoint returns 503 when redis dependency check fails", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await withOccupiedPort(async (occupiedPort) => {
      const { response } = await getBootstrapHealthResponse({
        envOverrides: {
          ...validApiEnv,
          ...dependencyEnv,
          REDIS_URL: `redis://127.0.0.1:${occupiedPort}`,
        },
      });

      assert.equal(response.statusCode, 503);
      assert.equal(response.body?.data?.resource?.service, "api");
      assert.equal(response.body?.data?.resource?.status, "unhealthy");
      assert.equal(response.body?.data?.resource?.checks?.database?.status, "healthy");
      assert.equal(response.body?.data?.resource?.checks?.redis?.status, "unhealthy");
      assert.match(response.body?.meta?.requestId ?? "", /^req_/);
    });
  });
});
