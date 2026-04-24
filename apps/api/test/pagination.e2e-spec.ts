import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  collectStream,
  getJson,
  repoRoot,
  spawnBootstrap,
  stopChild,
  waitForStdoutMatch,
  withMockDependencies,
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

type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type FixtureListBody = {
  data: { items: Array<{ id: string }>; total: number };
  meta: {
    requestId?: string;
    pagination: PaginationMeta;
  };
};

type FixtureErrorBody = {
  error: { code: string; details?: Array<{ field: string }>; requestId: string };
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

const withPaginationApi = async (
  callback: (context: { request: (pathName: string) => ReturnType<typeof getJson> }) => Promise<void>,
) => {
  await withMockDependencies(async (dependencyEnv) => {
    await withBootstrappedApi(
      callback,
      {
        ...validApiEnv,
        ...dependencyEnv,
      },
    );
  });
};

const assertPaginationMeta = (actual: PaginationMeta, expected: PaginationMeta) => {
  assert.deepEqual(actual, expected);
};

const assertFixtureListResponse = ({
  response,
  expectedItemCount,
  expectedFirstItemId,
  expectedPagination,
  expectRequestId = false,
}: {
  response: Awaited<ReturnType<ReturnType<typeof getJson>>>;
  expectedItemCount: number;
  expectedFirstItemId?: string;
  expectedPagination: PaginationMeta;
  expectRequestId?: boolean;
}) => {
  const body = response.body as FixtureListBody;

  assert.equal(response.statusCode, 200);
  assert.equal(body.data.items.length, expectedItemCount);
  assert.equal(body.data.total, 53);
  assert.equal(body.data.items[0]?.id, expectedFirstItemId);
  assertPaginationMeta(body.meta.pagination, expectedPagination);

  if (expectRequestId) {
    assert.match(body.meta.requestId ?? "", /^req_/);
  }
};

const assertValidationError = ({
  response,
  expectedField,
}: {
  response: Awaited<ReturnType<ReturnType<typeof getJson>>>;
  expectedField: string;
}) => {
  const body = response.body as FixtureErrorBody;

  assert.equal(response.statusCode, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.match(body.error.requestId, /^req_/);
  assert.ok(body.error.details?.some((detail) => detail.field === expectedField));
};

test("pagination fixture route returns default pagination metadata", async () => {
  await withPaginationApi(async ({ request }) => {
    const response = await request("/api/v1/pagination/fixtures");

    assertFixtureListResponse({
      response,
      expectedItemCount: 25,
      expectedFirstItemId: "fixture_001",
      expectedPagination: {
        page: 1,
        pageSize: 25,
        totalItems: 53,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      },
      expectRequestId: true,
    });
  });
});

test("pagination fixture route respects explicit page and pageSize", async () => {
  await withPaginationApi(async ({ request }) => {
    const response = await request("/api/v1/pagination/fixtures?page=2&pageSize=10");

    assertFixtureListResponse({
      response,
      expectedItemCount: 10,
      expectedFirstItemId: "fixture_011",
      expectedPagination: {
        page: 2,
        pageSize: 10,
        totalItems: 53,
        totalPages: 6,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    });
  });
});

test("pagination fixture route rejects invalid pagination params with VALIDATION_ERROR", async () => {
  await withPaginationApi(async ({ request }) => {
    assertValidationError({
      response: await request("/api/v1/pagination/fixtures?page=0"),
      expectedField: "page",
    });
    assertValidationError({
      response: await request("/api/v1/pagination/fixtures?pageSize=150"),
      expectedField: "pageSize",
    });
  });
});
