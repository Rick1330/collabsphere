# Release Readiness (agent-ref)

## Purpose
Provide an execution-focused checklist and gating rules for release readiness, aligned with canonical CI/CD, testing, and observability requirements.

## Canonical Sources
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/spec/14-devops/14.5-ci-pipeline.md`
- `docs/spec/15-testing/*`
- `docs/spec/13-observability/*`
- `docs/domains/quality/release-readiness.md`
- `docs/domains/quality/testing-strategy.md`
- `docs/domains/quality/observability.md`

## Domain Sources
- `docs/domains/quality/release-readiness.md`
- `docs/domains/quality/testing-strategy.md`
- `docs/domains/quality/observability.md`

## Scope
- Release gates and required checks
- Testing and build expectations
- Observability and readiness checks
- Deployment sequencing constraints
- Go/no-go criteria

## Required Rules / Contract
- **Main branch is deployable**; all changes merge via PR with CI passing.
- **Staging deploy** occurs on merge to main.
- **Production deploy** occurs manually (tag-based) or on approval.
- **CI required checks** (must pass):
  - Typecheck (TS)
  - Lint
  - Unit tests
  - Integration tests (DB required)
  - Build `web`, `api`, `collab`, `worker`
- **Deployment units**:
  - `web` deployed separately
  - `api`, `collab`, `worker` deployed together (shared network)

## Edge Cases / Failure Modes
- Failed CI gate blocks release.
- Incomplete migrations or missing env vars can cause runtime failures after deploy.
- Collab service restart must allow client reconnect (ensure readiness before prod rollout).

## Validation or Testing Notes
- Verify all required CI checks are green on main.
- Confirm staging deploy succeeded before production approval.
- Ensure integration tests that require DB/Redis are executed.
- Validate build artifacts for `web`, `api`, `collab`, and `worker`.

## Related Files / Domains
- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/ops/migrations.md`
- `docs/agent-ref/ops/deployment.md`
- `docs/agent-ref/ops/env-vars.md`
- `docs/agent-ref/rules/security-rules.md`


