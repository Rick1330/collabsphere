# Yjs CRDT State Guardrail

## Purpose
Protect canonical document content handling and derived state integrity.

## When to Use
- Any changes to document storage, indexing, or editor persistence.

## Required Inputs / Context
- Document storage schema and persistence logic.

## Read First
- `docs/agent-ref/collab/yjs-state-model.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/rules/business-rules.md`
- `apps/collab/AGENTS.md`

## Workflow
1. Treat `documents.content_yjs` as canonical content.
2. Derive `content_plaintext` from Yjs state only.
3. Ensure indexing uses derived plaintext, not CRDT decoding at query time.
4. Enforce no REST delivery of Yjs content.
5. Validate versioning/restore behavior uses Yjs snapshots.

## Dangerous Mistakes
- Treating `content_plaintext` as source-of-truth.
- Serializing Yjs into HTML and storing as canonical content.
- REST-based editing flows.

## Validation Expectations
- Verify persistence hooks update Yjs + plaintext.
- Validate restore creates `before_restore` snapshot.

## Escalation Conditions
- Any proposal to change canonical content format.

## Related Skills / References
- `guardrail/collab-hocuspocus.md`
- `guardrail/search-indexing.md`
- `apps/collab/AGENTS.md`
