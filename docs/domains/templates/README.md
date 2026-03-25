# templates/README

## Domain
Template system: workspace templates and document templates, how they are stored, browsed, previewed, and applied transactionally during workspace/document creation.

## Canonical Sources
- `docs/spec/05-features/05.3-templates.md` — §5.3 Templates
- `docs/spec/08-data-model/08.10-templates.md` — templates table
- `docs/spec/09-api-standards/09.6-idempotency.md` — idempotency guidance
- `docs/spec/15-testing/15.6-required-test-suites.md` — template testing requirements

## Included Topics
- Template types and scope (system/workspace future)
- Workspace template schema and application rules
- Document template format and conversion rules
- API contracts for listing and preview
- Data model fields (schemaVersion, contentFormat)
- Edge cases (disabled templates, schema mismatch, category mismatch)

## Related domains
- `workspaces/` (workspace creation applies workspace templates)
- `documents/` (document creation uses document templates; seeds CRDT state)
- `collab/` (CRDT state seeding interacts with Yjs persistence)
- `quality/` (testing strategy and release readiness)
