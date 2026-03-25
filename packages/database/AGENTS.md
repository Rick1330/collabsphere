# AGENTS.md

## Purpose
Local rules for database schema, migrations, and persistence conventions.

## Scope
`packages/database` Prisma schema, migrations, and DB utilities.

## Must Follow
- Prisma schema must match agent-ref data schemas and constraints.
- Enum values must match canonical enums (no new values without spec/domain update).
- Migrations must be additive and reversible where possible.
- Soft-delete (`deleted_at`) and retention rules are mandatory.
- Required indexes and constraints must be preserved.
- Workspace scoping is mandatory for all tables and relations.

## Never Do
- Use destructive migration shortcuts (drop/rename without safe backfill).
- Bypass migration workflow or edit the DB manually without a migration.
- Add cross-workspace references without explicit constraints.
- Change constraints/indexes without updating agent-ref data rules.

## Tests / Validation
- Validate schema changes against agent-ref data rules.
- Add migration tests or verification steps when constraints change.
- Verify indexes for search vectors and workspace scoping remain intact.

## References
- `docs/agent-ref/data/README.md`
- `docs/agent-ref/data/workspace-schema.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/data/task-schema.md`
- `docs/agent-ref/data/comment-schema.md`
- `docs/agent-ref/data/notification-schema.md`
- `docs/agent-ref/data/export-schema.md`
- `docs/agent-ref/rules/business-rules.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/ops/migrations.md`
