# Search Indexing Guardrail

## Purpose
Ensure search indexing is correct, secure, and derived from canonical content.

## When to Use
- Any changes to search indexing or query behavior.

## Required Inputs / Context
- Search schema and FTS configuration.

## Read First
- `docs/agent-ref/api/search-endpoints.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/data/task-schema.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `apps/api/AGENTS.md`

## Workflow
1. Use `content_plaintext` for document search (derived from Yjs).
2. Maintain FTS indexes and weights per spec.
3. Enforce workspace scoping for all searches.
4. Admin search only under `/admin/*`, is not membership-scoped, and excludes soft-deleted entities.
5. Do not log raw search queries (hash only).

## Dangerous Mistakes
- Searching raw Yjs state at query time.
- Returning cross-workspace results.
- Logging raw queries.

## Validation Expectations
- Verify FTS indexes exist and update on content changes.
- Add cross-workspace denial tests.

## Escalation Conditions
- Any changes to ranking or scope rules without spec alignment.

## Related Skills / References
- `guardrail/workspace-isolation.md`
- `implementation/prisma-schema.md`
- `apps/api/AGENTS.md`
