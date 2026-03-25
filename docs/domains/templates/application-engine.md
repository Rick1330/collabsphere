# templates/application-engine

## Domain
Backend template application engine (transactional, idempotent).

## Canonical Sources
- `docs/spec/05-features/` — §5.3.7 Template Application Engine
- `docs/spec/04-user-flows/` — FL-003 creation sequence diagram
- `docs/spec/09-api-standards/` — idempotency
- `docs/spec/12-errors/` — TEMPLATE_APPLICATION_FAILED

## Included Topics
- Workspace template application steps (transaction)
- Document template application steps (seed CRDT)
- Failure handling and rollback
- Idempotency requirements

## Workspace template application (v1)
Must be atomic (single DB transaction). Canonical step order:
1. Create `workspaces`
2. Create owner `workspace_members` row
3. Apply `workspace_settings` defaults + role labels
4. Create folders
5. Create documents + seed CRDT state
6. Create task board columns
7. Record activity: `workspace.created` and `workspace.template_applied`

Failure handling:
- If any step fails → rollback entire creation.
- Return `TEMPLATE_APPLICATION_FAILED`.

Idempotency:
- Support `X-Idempotency-Key` on workspace creation.
- If same key is reused by same user within TTL, return original response.

## Document template application
1. Load template
2. Convert markdown → Tiptap JSON (preferred for templates)
3. Seed Yjs state (`documents.content_yjs`)
4. Persist derived plaintext for search

Schema validation:
- Validate template schema versions.
- Reject unsupported schema versions with `TEMPLATE_SCHEMA_UNSUPPORTED`.
