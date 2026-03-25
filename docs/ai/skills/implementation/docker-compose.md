# Docker Compose Workflow

## Purpose
Safely modify local dev Docker Compose setup.

## When to Use
- Changes to local services, ports, or health checks.

## Required Inputs / Context
- Local dev requirements and env vars.

## Read First
- `docs/agent-ref/ops/local-dev.md`
- `docs/agent-ref/ops/env-vars.md`

## Workflow
1. Confirm required services (Postgres, Redis, optional MinIO).
2. Preserve existing ports and service names unless explicitly required.
3. Add health checks when introducing new services.
4. Keep secrets out of compose files.

## Dangerous Mistakes
- Breaking existing service names or ports.
- Committing secrets.

## Validation Expectations
- `pnpm dev` should start all services.
- Confirm API/collab/worker connectivity to Postgres/Redis.

## Escalation Conditions
- Changes that affect production or CI environments.

## Related Skills / References
- `implementation/github-actions.md`
- `docs/agent-ref/ops/ci-cd.md`
