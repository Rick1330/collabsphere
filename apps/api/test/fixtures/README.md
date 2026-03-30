# API Test Fixtures

This directory is the API-local compatibility entrypoint for integration test
fixtures referenced by task `#210`.

## Current source of truth

The executable integration harness currently lives at the repo root under
`tests/integration/`, so the real fixture implementation remains in:

- `tests/integration/fixtures/index.mjs`
- `tests/integration/fixtures/README.md`

This API-local surface exists so future API-local integration suites have a
stable import path without duplicating fixture logic today.

## Current usage

- use `apps/api/test/fixtures/index.ts` if API-local tests need a canonical
  fixture import path
- the exported helper delegates directly to the root integration fixture source
  of truth
- local setup and teardown guidance remains documented in
  `tests/integration/fixtures/README.md`

## Why this exists

The issue contract listed `apps/api/test/fixtures/*`, but the live executable
integration surface is currently root-level. This compatibility layer keeps the
deliverable path honest without inventing a separate, drifting fixture
implementation.

