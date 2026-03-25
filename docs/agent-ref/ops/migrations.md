# Migrations (agent-ref)

## Purpose
Provide an execution-focused reference for database migration rules, workflows, and safety constraints.

## Canonical Sources
- `docs/spec/14-devops/14.4-db-migrations.md`
- `docs/spec/14-devops/14.2-local-dev-environment.md`
- `docs/spec/14-devops/14.3-environments.md`
- `docs/domains/architecture/env-config.md`

## Domain Sources
- `docs/domains/architecture/env-config.md`

## Scope
- Migration rules (Prisma)
- Local vs staging/prod workflows
- Safety guidance for destructive changes
- Review and change-control expectations

## Required Rules / Contract

### Migration Rules (MUST)
- All schema changes go through **Prisma migrations**.
- No manual SQL in production without a tracked migration file.
- Migrations must be reviewed like code.

### Workflow (canonical)
```/dev/null/bash#L1-4
pnpm prisma migrate dev --name create_tasks_table
pnpm prisma migrate deploy   # on staging/prod
```

### Safety (MUST)
- Avoid destructive changes without a backfill strategy.
- For large tables:
  1) add new column nullable
  2) backfill in worker/job
  3) make non-nullable later

## Edge Cases / Failure Modes
- Destructive migrations without backfill can break production data; prohibit direct drops.
- Running `migrate dev` in staging/prod is not allowed; use `migrate deploy`.
- Missing or inconsistent env vars can cause migrations to run against the wrong database.

## Validation or Testing Notes
- Validate migrations in CI using a fresh database.
- Verify data backfills complete before enforcing non-null constraints.
- Ensure migration history is consistent across environments.

## Related Files / Domains
- `docs/agent-ref/ops/local-dev.md`
- `docs/agent-ref/ops/env-vars.md`
- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/rules/security-rules.md`


