# Templates Engine Guardrail

## Purpose
Ensure template application is safe, transactional, and aligned with schema/version rules.

## When to Use
- Any changes to template application or schema handling.

## Required Inputs / Context
- Template schema version and category.

## Read First
- `docs/agent-ref/api/template-endpoints.md`
- `docs/agent-ref/data/template-schema.md`
- `docs/agent-ref/rules/business-rules.md`
- `apps/api/AGENTS.md`

## Workflow
1. Validate template schema version and category match.
2. Apply templates transactionally during workspace creation.
3. Enforce idempotency for template application.
4. Seed documents/tasks using canonical data formats (Yjs state for docs).

## Dangerous Mistakes
- Partial template application without rollback.
- Mismatched template category or schema version.
- Seeding document content via REST/HTML rather than Yjs.

## Validation Expectations
- Validate transactionality and error codes on failures.
- Verify seeded data respects workspace isolation.

## Escalation Conditions
- Any new template schema or category without spec update.

## Related Skills / References
- `guardrail/yjs-crdt-state.md`
- `implementation/nestjs-api-endpoint.md`
- `apps/api/AGENTS.md`
