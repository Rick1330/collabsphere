import assert from "node:assert/strict";
import net from "node:net";
import path from "node:path";
import test from "node:test";
import { once } from "node:events";

import {
  collectStream,
  getJson,
  repoRoot,
  spawnBootstrap,
  stopChild,
  waitForStdoutMatch,
} from "../../../tests/unit/bootstrap-test-helpers.ts";

const apiEntryPath = path.join(repoRoot, "apps", "api", "src", "dev.ts");

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
    if (chunk.toString("utf8").startsWith(redisExpectedPing)) {
      socket.write(redisPongBuffer);
    }

    socket.end();
  });

const withMockDependencies = async (
  callback: (dependencyEnv: { DATABASE_URL: string; REDIS_URL: string }) => Promise<void>,
) => {
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

const withBootstrappedApi = async (
  callback: (context: { request: (pathName: string) => ReturnType<typeof getJson> }) => Promise<void>,
  envOverrides: NodeJS.ProcessEnv,
) => {
  const child = spawnApi(envOverrides);
  const stdoutText = collectStream(child.stdout);

  try {
    const match = await waitForStdoutMatch(
      child,
      stdoutText,
      /bootstrap listening on http:\/\/[^:]+:(\d+)\/api\/v1\/health/,
      "API bootstrap readiness",
    );
    const port = Number.parseInt(match[1], 10);

    await callback({
      request: (pathName) => getJson(port, pathName),
    });
  } finally {
    await stopChild(child);
  }
};

test("pagination fixture route returns default pagination metadata", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await withBootstrappedApi(
      async ({ request }) => {
        const response = await request("/api/v1/pagination/fixtures");
        const body = response.body as {
          data: { items: Array<{ id: string }>; total: number };
          meta: {
            requestId: string;
            pagination: {
              page: number;
              pageSize: number;
              totalItems: number;
              totalPages: number;
              hasNextPage: boolean;
              hasPreviousPage: boolean;
            };
          };
        };

        assert.equal(response.statusCode, 200);
        assert.equal(body.data.items.length, 25);
        assert.equal(body.data.total, 53);
        assert.equal(body.meta.pagination.page, 1);
        assert.equal(body.meta.pagination.pageSize, 25);
        assert.equal(body.meta.pagination.totalItems, 53);
        assert.equal(body.meta.pagination.totalPages, 3);
        assert.equal(body.meta.pagination.hasNextPage, true);
        assert.equal(body.meta.pagination.hasPreviousPage, false);
        assert.match(body.meta.requestId, /^req_/);
      },
      {
        ...validApiEnv,
        ...dependencyEnv,
      },
    );
  });
});

test("pagination fixture route respects explicit page and pageSize", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await withBootstrappedApi(
      async ({ request }) => {
        const response = await request("/api/v1/pagination/fixtures?page=2&pageSize=10");
        const body = response.body as {
          data: { items: Array<{ id: string }>; total: number };
          meta: {
            pagination: {
              page: number;
              pageSize: number;
              totalItems: number;
              totalPages: number;
              hasNextPage: boolean;
              hasPreviousPage: boolean;
            };
          };
        };

        assert.equal(response.statusCode, 200);
        assert.equal(body.data.items.length, 10);
        assert.equal(body.data.items[0]?.id, "fixture_011");
        assert.equal(body.meta.pagination.page, 2);
        assert.equal(body.meta.pagination.pageSize, 10);
        assert.equal(body.meta.pagination.totalItems, 53);
        assert.equal(body.meta.pagination.totalPages, 6);
        assert.equal(body.meta.pagination.hasNextPage, true);
        assert.equal(body.meta.pagination.hasPreviousPage, true);
      },
      {
        ...validApiEnv,
        ...dependencyEnv,
      },
    );
  });
});

test("pagination fixture route rejects invalid pagination params with VALIDATION_ERROR", async () => {
  await withMockDependencies(async (dependencyEnv) => {
    await withBootstrappedApi(
      async ({ request }) => {
        const invalidPageResponse = await request("/api/v1/pagination/fixtures?page=0");
        const invalidPageBody = invalidPageResponse.body as {
          error: { code: string; details?: Array<{ field: string }>; requestId: string };
        };

        assert.equal(invalidPageResponse.statusCode, 400);
        assert.equal(invalidPageBody.error.code, "VALIDATION_ERROR");
        assert.match(invalidPageBody.error.requestId, /^req_/);
        assert.ok(invalidPageBody.error.details?.some((detail) => detail.field === "page"));

        const invalidSizeResponse = await request("/api/v1/pagination/fixtures?pageSize=150");
        const invalidSizeBody = invalidSizeResponse.body as {
          error: { code: string; details?: Array<{ field: string }>; requestId: string };
        };

        assert.equal(invalidSizeResponse.statusCode, 400);
        assert.equal(invalidSizeBody.error.code, "VALIDATION_ERROR");
        assert.match(invalidSizeBody.error.requestId, /^req_/);
        assert.ok(invalidSizeBody.error.details?.some((detail) => detail.field === "pageSize"));
      },
      {
        ...validApiEnv,
        ...dependencyEnv,
      },
    );
  });
});
