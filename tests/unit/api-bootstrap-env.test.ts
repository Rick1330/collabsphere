import assert from "node:assert/strict";
import { once } from "node:events";
import net from "node:net";
import test from "node:test";
import path from "node:path";
import {
  collectStream,
  getJson,
  repoRoot,
  runTsc,
  runTsx,
  spawnBootstrap,
  stopChild,
  waitForStdoutMatch,
} from "./bootstrap-test-helpers.ts";

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

const spawnApi = (envOverrides: NodeJS.ProcessEnv) =>
  spawnBootstrap({ entryPath: apiEntryPath, cwd: repoRoot, envOverrides });

const spawnBuiltApi = (envOverrides: NodeJS.ProcessEnv) =>
  spawnBootstrap({
    entryPath: builtApiEntryPath,
    cwd: path.join(repoRoot, "apps", "api", "dist"),
    envOverrides,
  });

const postgresSslResponseBuffer = Buffer.from("S");
const redisExpectedPing = "*1\r\n$4\r\nPING\r\n";
const redisPongBuffer = Buffer.from("+PONG\r\n");

const closeServer = (server: net.Server) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const createMockDependencyServer = async (onData: (chunk: Buffer, socket: net.Socket) => void) => {
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

const createHangingRedisServer = () =>
  createMockDependencyServer(() => {
    // Intentionally keep the socket open to exercise timeout behavior.
  });

const withOccupiedPort = async (callback: (port: number) => Promise<void>) => {
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

const withMockDependencies = async (
  callback: (dependencyEnv: { DATABASE_URL: string; REDIS_URL: string }) => Promise<void>,
  createRedisServer = createMockRedisServer,
) => {
  const postgres = await createMockPostgresServer();
  const redis = await createRedisServer();

  try {
    await callback({
      DATABASE_URL: `postgresql://collab:collab@127.0.0.1:${postgres.port}/collabsphere`,
      REDIS_URL: `redis://127.0.0.1:${redis.port}`,
    });
  } finally {
    await Promise.allSettled([closeServer(postgres.server), closeServer(redis.server)]);
  }
};

type HealthResponse = Awaited<ReturnType<typeof getJson>>;

const getBootstrapHealthResponse = async ({
  spawn = spawnApi,
  envOverrides = validApiEnv,
}: {
  spawn?: (envOverrides: NodeJS.ProcessEnv) => ReturnType<typeof spawnBootstrap>;
  envOverrides?: NodeJS.ProcessEnv;
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

const withBootstrappedApi = async (
  callback: (context: {
    request: (
      pathName?: string,
      options?: Parameters<typeof getJson>[2],
    ) => ReturnType<typeof getJson>;
    stdout: () => string;
    stderr: () => string;
  }) => Promise<void>,
  {
    spawn = spawnApi,
    envOverrides = validApiEnv,
  }: {
    spawn?: (envOverrides: NodeJS.ProcessEnv) => ReturnType<typeof spawnBootstrap>;
    envOverrides?: NodeJS.ProcessEnv;
  } = {},
) => {
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
    const port = Number.parseInt(match[1], 10);

    await callback({
      request: (pathName = "/api/v1/health", options) => getJson(port, pathName, options),
      stdout: stdoutText,
      stderr: stderrText,
    });
  } finally {
    await stopChild(child);
  }
};

const getHealthEnvelope = (response: HealthResponse) => {
  const body = response.body as {
    data?: {
      resource?: {
        service: string;
        status: string;
        checks: Record<string, { status: string; detail?: string }>;
      };
    };
    meta?: { requestId: string };
  };

  assert.ok(body, "health response body should be present");
  assert.ok(body.data, "health response data should be present");
  assert.ok(body.data.resource, "health response resource should be present");
  assert.ok(body.meta, "health response meta should be present");

  return {
    resource: body.data.resource,
    meta: body.meta,
  };
};

const getRequestIdHeader = (response: HealthResponse) =>
  typeof response.headers?.["x-request-id"] === "string" ? response.headers["x-request-id"] : null;

const extractStructuredLogEntries = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);

const assertHealthyBootstrap = async (options = {}) => {
  const { response, stderr } = await getBootstrapHealthResponse(options);
  const envelope = getHealthEnvelope(response);
  const requestIdHeader = getRequestIdHeader(response);

  assert.equal(response.statusCode, 200);
  assert.equal(envelope.resource.service, "api");
  assert.equal(envelope.resource.status, "healthy");
  assert.equal(envelope.resource.checks.database.status, "healthy");
  assert.equal(envelope.resource.checks.redis.status, "healthy");
  assert.match(envelope.meta.requestId, /^req_/);
  assert.equal(requestIdHeader, envelope.meta.requestId);
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
  runTsx("scripts/build-bootstrap-app.ts", "apps/api");

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

test("unknown bootstrap routes return the canonical error envelope with requestId", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await withBootstrappedApi(
      async ({ request, stderr }) => {
        const response = await request("/api/v1/missing");
        const body = response.body as {
          error?: {
            code?: string;
            message?: string;
            requestId?: string;
            timestamp?: string;
          };
        };
        const requestIdHeader = getRequestIdHeader(response);

        assert.equal(response.statusCode, 404);
        assert.ok(body.error);
        assert.equal(body.error.code, "NOT_FOUND");
        assert.equal(body.error.message, "No bootstrap route for GET /api/v1/missing");
        assert.match(body.error.requestId ?? "", /^req_/);
        assert.equal(requestIdHeader, body.error.requestId);
        assert.match(body.error.timestamp ?? "", /^\d{4}-\d{2}-\d{2}T/);

        const logEntries = extractStructuredLogEntries(stderr());
        const requestLog = logEntries.find((entry) => entry.message === "request_failed");

        assert.ok(requestLog);
        assert.equal(requestLog.requestId, body.error.requestId);
        assert.equal(requestLog.method, "GET");
        assert.equal(requestLog.path, "/api/v1/missing");
        assert.equal(requestLog.statusCode, 404);
        assert.equal(requestLog.errorCode, "NOT_FOUND");
      },
      {
        envOverrides: {
          ...validApiEnv,
          ...dependencyEnv,
        },
      },
    );
  });
});

test("bootstrap preserves valid incoming request IDs", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await withBootstrappedApi(
      async ({ request }) => {
        const response = await request("/api/v1/health", {
          headers: {
            "x-request-id": "req_client_trace_123",
          },
        });
        const envelope = getHealthEnvelope(response);

        assert.equal(response.statusCode, 200);
        assert.equal(envelope.meta.requestId, "req_client_trace_123");
        assert.equal(getRequestIdHeader(response), "req_client_trace_123");
      },
      {
        envOverrides: {
          ...validApiEnv,
          ...dependencyEnv,
        },
      },
    );
  });
});

test("bootstrap replaces invalid incoming request IDs with generated values", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await withBootstrappedApi(
      async ({ request }) => {
        const response = await request("/api/v1/health", {
          headers: {
            "x-request-id": "invalid request id",
          },
        });
        const envelope = getHealthEnvelope(response);
        const requestIdHeader = getRequestIdHeader(response);

        assert.equal(response.statusCode, 200);
        assert.match(envelope.meta.requestId, /^req_[0-9A-HJKMNP-TV-Z]{26}$/);
        assert.equal(requestIdHeader, envelope.meta.requestId);
        assert.notEqual(envelope.meta.requestId, "invalid request id");
      },
      {
        envOverrides: {
          ...validApiEnv,
          ...dependencyEnv,
        },
      },
    );
  });
});

test("bootstrap emits structured request logs with requestId and request metadata", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await withBootstrappedApi(
      async ({ request, stdout }) => {
        const response = await request("/api/v1/health", {
          headers: {
            "user-agent": "api-bootstrap-test",
          },
        });
        const envelope = getHealthEnvelope(response);
        const logEntries = extractStructuredLogEntries(stdout());
        const requestLog = logEntries.find((entry) => entry.message === "request_completed");

        assert.ok(requestLog);
        assert.equal(requestLog.requestId, envelope.meta.requestId);
        assert.equal(requestLog.method, "GET");
        assert.equal(requestLog.path, "/api/v1/health");
        assert.equal(requestLog.statusCode, 200);
        assert.equal(requestLog.userAgent, "api-bootstrap-test");
        assert.equal(requestLog.ip, "127.0.0.1");
        assert.equal(typeof requestLog.durationMs, "number");
      },
      {
        envOverrides: {
          ...validApiEnv,
          ...dependencyEnv,
        },
      },
    );
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
      const envelope = getHealthEnvelope(response);
      const requestIdHeader = getRequestIdHeader(response);

      assert.equal(response.statusCode, 503);
      assert.equal(envelope.resource.service, "api");
      assert.equal(envelope.resource.status, "unhealthy");
      assert.equal(envelope.resource.checks.database.status, "healthy");
      assert.equal(envelope.resource.checks.redis.status, "unhealthy");
      assert.match(envelope.meta.requestId, /^req_/);
      assert.equal(requestIdHeader, envelope.meta.requestId);
    });
  });
});

test("health endpoint returns 503 quickly when redis probe times out", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    const startedAt = Date.now();
    const { response, stderr } = await getBootstrapHealthResponse({
      envOverrides: {
        ...validApiEnv,
        ...dependencyEnv,
        HEALTH_CHECK_TIMEOUT_MS: "200",
      },
    });
    const elapsedMs = Date.now() - startedAt;
    const envelope = getHealthEnvelope(response);

    assert.equal(response.statusCode, 503);
    assert.equal(envelope.resource.service, "api");
    assert.equal(envelope.resource.status, "unhealthy");
    assert.equal(envelope.resource.checks.database.status, "healthy");
    assert.equal(envelope.resource.checks.redis.status, "unhealthy");
    assert.equal(envelope.resource.checks.redis.detail, "REDIS_TIMEOUT");
    const logEntries = extractStructuredLogEntries(stderr);
    const requestLog = logEntries.find((entry) => entry.message === "request_failed");

    assert.ok(requestLog);
    assert.equal(requestLog.requestId, envelope.meta.requestId);
    assert.equal(requestLog.path, "/api/v1/health");
    assert.equal(requestLog.statusCode, 503);
    assert.ok(elapsedMs < 2000, `expected timeout response under 2s, got ${elapsedMs}ms`);
  }, createHangingRedisServer);
});
