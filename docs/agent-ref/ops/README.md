# Ops — Agent Execution Reference

## Purpose
Provide an execution-focused index for operational concerns: local development, environment variables, CI/CD, migrations, deployment, and release readiness.

## Canonical Sources
- `docs/spec/14-devops/14.1-overview.md`
- `docs/spec/14-devops/14.2-local-dev-environment.md`
- `docs/spec/14-devops/14.3-environments.md`
- `docs/spec/14-devops/14.4-db-migrations.md`
- `docs/spec/14-devops/14.5-ci-pipeline.md`
- `docs/spec/14-devops/14.6-deployment-strategy.md`
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/spec/15-testing/*` (release criteria inputs)
- `docs/spec/13-observability/*` (release readiness inputs)

## Domain Sources
- `docs/domains/architecture/env-config.md`
- `docs/domains/quality/release-readiness.md`
- `docs/domains/quality/testing-strategy.md`
- `docs/domains/quality/observability.md`

## Scope
- Local startup and required dependencies
- Environment variable conventions and secrets handling
- Migration workflow and safety
- CI pipeline gates
- Deployment units and strategy
- Release readiness criteria

## Required Rules / Contract
- Local dev: `pnpm install` + `pnpm dev` starts `web`, `api`, `collab`, `worker` plus Docker services (Postgres, Redis; MinIO/MailHog optional).
- `.env.local` must never be committed; `.env.example` must be kept in sync.
- All schema changes go through Prisma migrations; no manual SQL in production.
- CI must run lint, typecheck, unit tests, integration tests, and build.
- Deployment units: `web` separate; `api`, `collab`, `worker` together on shared network.
- Release process: main is deployable; staging on merge; prod on approval/tag.

## Edge Cases / Failure Modes
- Destructive migrations require phased rollout (nullable → backfill → non-null).
- Collab server restarts must allow automatic client reconnects.
- Missing or inconsistent env vars can cause partial startup failures across services.

## Validation or Testing Notes
- CI gate failures block release.
- Observability checks are part of readiness gates.

## Related Files / Domains
- `local-dev.md`
- `env-vars.md`
- `ci-cd.md`
- `migrations.md`
- `deployment.md`
- `release-readiness.md`
- `docs/agent-ref/rules/*`

