import assert from "node:assert/strict";
import test from "node:test";

import { createServiceSmokeFixtures } from "../integration/fixtures/index.ts";

test("service smoke fixtures stay deterministic with default env", () => {
  const fixtures = createServiceSmokeFixtures({});

  assert.equal(fixtures.metadata.suiteId, "cs-003-integration-smoke");
  assert.equal(fixtures.metadata.createdAt, "2026-01-01T00:00:00.000Z");
  assert.equal(fixtures.timing.maxAttempts, 20);
  assert.equal(fixtures.services.postgres.id, "fixture-postgres-smoke");
  assert.equal(fixtures.services.postgres.host, "127.0.0.1");
  assert.equal(fixtures.services.postgres.port, 5432);
  assert.equal(fixtures.services.redis.id, "fixture-redis-smoke");
  assert.equal(fixtures.services.redis.host, "127.0.0.1");
  assert.equal(fixtures.services.redis.port, 6379);
  assert.equal(fixtures.localSetup.startServicesCommand, "docker compose up -d postgres redis");
});

test("service smoke fixtures fail clearly on invalid ports", () => {
  assert.throws(
    () => createServiceSmokeFixtures({ POSTGRES_PORT: "70000" }),
    /POSTGRES_PORT must be a valid TCP port/,
  );

  assert.throws(
    () => createServiceSmokeFixtures({ REDIS_PORT: "abc" }),
    /REDIS_PORT must be a valid TCP port/,
  );

  assert.throws(
    () => createServiceSmokeFixtures({ POSTGRES_PORT: "5432foo" }),
    /POSTGRES_PORT must be a valid TCP port/,
  );

  assert.throws(
    () => createServiceSmokeFixtures({ POSTGRES_PORT: "0" }),
    /POSTGRES_PORT must be a valid TCP port/,
  );

  assert.throws(
    () => createServiceSmokeFixtures({ REDIS_PORT: "-1" }),
    /REDIS_PORT must be a valid TCP port/,
  );

  assert.throws(
    () => createServiceSmokeFixtures({ REDIS_PORT: "65536" }),
    /REDIS_PORT must be a valid TCP port/,
  );
});

test("service smoke fixtures accept valid port boundaries", () => {
  assert.doesNotThrow(() => createServiceSmokeFixtures({ POSTGRES_PORT: "1" }));
  assert.doesNotThrow(() => createServiceSmokeFixtures({ REDIS_PORT: "65535" }));
});
