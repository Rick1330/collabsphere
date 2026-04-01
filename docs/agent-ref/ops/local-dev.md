# Local Development (agent-ref)

## Purpose
Provide an execution-focused reference for local development setup, prerequisites, and required services for CollabSphere.

## Canonical Sources
- `docs/spec/14-devops/14.2-local-dev-environment.md`
- `docs/spec/14-devops/14.3-environments.md`
- `docs/spec/14-devops/14.4-db-migrations.md`
- `docs/domains/architecture/env-config.md`

## Domain Sources
- `docs/domains/architecture/env-config.md`

## Scope
- Prerequisites and tooling
- One-command local startup
- Required Docker services
- Local environment rules
- Optional local services

## Required Rules / Contract

### Prerequisites
- Node.js 20 LTS
- pnpm 9.x
- Docker Desktop (or Docker Engine + Compose)
- Git

### One-command local startup
```/dev/null/bash#L1-4
pnpm install
pnpm dev
```

`pnpm dev` starts:
- `apps/web` (static web bootstrap served from `src/index.html`)
- `apps/api` (NestJS REST + Socket.IO)
- `apps/collab` (Hocuspocus)
- `apps/worker` (BullMQ workers)

### Required local services (Docker)
Minimum services:
- PostgreSQL
- Redis

Optional (v1.1+):
- MinIO (S3-compatible local object storage)
- MailHog (email capture)

### Environment rules
- `.env.local` must never be committed.
- `.env.example` must be committed and kept in sync.

## Edge Cases / Failure Modes
- If Postgres or Redis are not running, `api`, `collab`, and `worker` will fail to start or behave inconsistently.
- Missing or invalid env vars can lead to silent startup failures; ensure `.env.local` is complete.

## Validation or Testing Notes
- Verify API and collab services can connect to Postgres and Redis before running tests.
- Confirm `pnpm dev` boots all four app services without errors.
- For local API checks, use `API_BASE_URL` (defaults to `http://localhost:3001` if unset).

## Related Files / Domains
- `docs/agent-ref/ops/env-vars.md`
- `docs/agent-ref/ops/migrations.md`
- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/ops/deployment.md`
- `docs/agent-ref/rules/security-rules.md`


