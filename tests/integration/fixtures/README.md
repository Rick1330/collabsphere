# Integration Fixtures

These fixtures back the current root integration-test surface in `tests/integration/`.
They live here instead of `apps/api/test/fixtures/` because the repo's active
integration tests currently run from the root Node test harness, not from an
API-local Jest or Nest test tree.

## Current Fixture Scope

- deterministic fixture metadata for the CI story integration smoke suite
- stable service labels and IDs for PostgreSQL and Redis smoke checks
- shared env parsing for `POSTGRES_HOST`, `POSTGRES_PORT`, `REDIS_HOST`, and `REDIS_PORT`
- setup and teardown guidance for local runs

## Determinism Contract

- fixture suite ID: `cs-003-integration-smoke`
- fixture timestamp: `2026-01-01T00:00:00.000Z`
- service fixture IDs:
  - `fixture-postgres-smoke`
  - `fixture-redis-smoke`

Keep new fixture IDs and timestamps explicit and stable so integration runs stay
repeatable across local and CI environments.

## Local Setup

Start the required services before `pnpm test:integration`:

```bash
docker compose up -d postgres redis
docker compose ps
```

The smoke suite expects PostgreSQL and Redis to be reachable and healthy or
running. It does not create persistent application data yet, so there is no DB
row teardown step.

## Teardown

- each socket probe must close its socket in a `finally` block
- no external data cleanup is required for the current smoke fixtures
- for local cleanup after the suite:

```bash
docker compose stop postgres redis
```

## Extending Fixtures

- keep fixture helpers under `tests/integration/fixtures/` while the active
  integration surface remains root-level
- only move them under `apps/api/test/fixtures/` if the actual executable
  integration surface moves there too
- prefer deterministic IDs, timestamps, and explicit teardown notes for every
  new fixture

