# Yjs State Model (agent-ref)

## Purpose
Provide a compact, execution-focused reference for the Yjs CRDT state model, storage format, and required invariants for collaboration.

## Canonical Sources
- `docs/domains/collab/yjs.md`
- `docs/domains/collab/persistence.md`
- `docs/domains/documents/data-model.md`
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md`
- `docs/spec/08-data-model/08.5-documents-submissions.md`
- `docs/spec/05-features/05.4-documents.md`

## Domain Sources
- `docs/domains/collab/yjs.md`
- `docs/domains/collab/persistence.md`
- `docs/domains/documents/data-model.md`

## Scope
- Canonical CRDT storage format and fields
- Persistence cadence and merge behavior
- Derived plaintext requirements for search
- Offline editing and reconciliation

## Required Rules / Contract
- Canonical document content is stored as Yjs binary state in `documents.content_yjs` (BYTEA).
- The collaboration server (Hocuspocus) is the only source of editable CRDT content; REST is metadata-only.
- Yjs updates must merge deterministically; offline edits are allowed and must reconcile on reconnect.
- Persistence must be best-effort and coalesced (no per-keystroke persistence).
- `documents.content_plaintext` must be derived from Yjs state and used for search indexing.

## Edge Cases / Failure Modes
- Collab server outage: clients open in read-only mode; no CRDT editing via REST.
- DB outage: realtime sync may continue; persistence retries are required.
- Permission changes mid-session: server must reject new updates immediately.

## Validation or Testing Notes
- Validate that `content_yjs` updates are persisted on store hooks and not via REST.
- Ensure plaintext derivation updates on persistence (sync or async).
- Test offline edit → reconnect → merge behavior.
- Verify read-only users cannot publish Yjs updates.

## Related Files / Domains
- `docs/agent-ref/collab/hocuspocus-hooks.md`
- `docs/agent-ref/collab/read-only-rules.md`
- `docs/agent-ref/collab/collaboration-failure-modes.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/rules/workspace-isolation.md`


