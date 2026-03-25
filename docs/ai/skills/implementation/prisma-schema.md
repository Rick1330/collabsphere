# Prisma Schema Change

## Purpose
Safely modify Prisma schema and migrations while preserving canonical data rules.

## When to Use
- Adding columns, indexes, enums, or new tables.

## Required Inputs / Context
- Relevant `docs/agent-ref/data/*` and business rules.

## Read First
- `packages/database/AGENTS.md`
- `docs/agent-ref/data/README.md`
- `docs/agent-ref/ops/migrations.md`

## Workflow
1. Confirm schema changes align with `docs/agent-ref/data/*`.
2. Keep migrations additive; provide safe backfill or defaults.
3. Preserve required indexes and constraints.
4. Ensure enums match canonical values.
5. Update migrations and validation tests.

## Dangerous Mistakes
- Destructive migrations without rollback/backfill.
- Introducing non-canonical enum values.
- Removing required indexes or constraints.

## Validation Expectations
- Run migration checks and schema validations.
- Verify index presence for search and workspace scoping.

## Escalation Conditions
- Any schema change not represented in agent-ref data models.

## Related Skills / References
- `guardrail/search-indexing.md`
- `implementation/integration-test-writer.md`
