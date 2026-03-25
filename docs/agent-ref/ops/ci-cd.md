# CI/CD (agent-ref)

## Purpose
Provide an execution-focused reference for CollabSphere CI/CD requirements, required checks, and release gating.

## Canonical Sources
- `docs/spec/14-devops/14.5-ci-pipeline.md`
- `docs/spec/14-devops/14.6-deployment-strategy.md`
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/spec/15-testing/*`
- `docs/spec/13-observability/*`
- `docs/domains/quality/testing-strategy.md`
- `docs/domains/quality/release-readiness.md`
- `docs/domains/quality/observability.md`

## Domain Sources
- `docs/domains/quality/testing-strategy.md`
- `docs/domains/quality/release-readiness.md`
- `docs/domains/quality/observability.md`

## Scope
- Required CI checks on PRs
- Build and test stages
- Optional (P2) gates
- Deployment triggers for staging and production
- Release readiness inputs

## Required Rules / Contract

### Required PR checks (MUST)
- Typecheck (TS)
- Lint
- Unit tests
- Integration tests (DB required)
- Build: `web`, `api`, `collab`, `worker`

### Required CI stages (minimum)
1. Install dependencies
2. Lint
3. Typecheck
4. Unit tests
5. Integration tests (Postgres/Redis services)
6. Build (all apps)

### Optional (P2)
- Playwright E2E tests on staging preview
- Lighthouse CI for performance regression

### Deployment rules (v1)
- `main` branch is deployable.
- Merge to `main` → deploy staging.
- Production deploy is manual (tag-based or approval).

### Deployment units
- `web` deployed separately.
- `api`, `collab`, `worker` deployed together on shared network.

## Edge Cases / Failure Modes
- Integration tests require DB/Redis services; missing services must fail fast.
- Collab server restarts must allow reconnect without data loss.
- Build failures must block merges/releases.

## Validation or Testing Notes
- CI gate failures block release.
- Ensure observability checks (logging/metrics) are part of readiness gates.
- Verify staging deploy happens on merge to `main`.

## Related Files / Domains
- `docs/agent-ref/ops/local-dev.md`
- `docs/agent-ref/ops/migrations.md`
- `docs/agent-ref/ops/deployment.md`
- `docs/agent-ref/ops/release-readiness.md`
- `docs/agent-ref/rules/security-rules.md`


