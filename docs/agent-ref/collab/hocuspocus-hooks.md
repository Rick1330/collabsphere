# Hocuspocus Hooks (agent-ref)

## Purpose
Provide execution-focused reference for Hocuspocus collaboration hooks, required behaviors, and persistence rules.

## Canonical Sources
- `docs/domains/collab/hocuspocus.md`
- `docs/domains/collab/persistence.md`
- `docs/domains/collab/read-only-rules.md`
- `docs/domains/collab/failure-modes.md`
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md`
- `docs/spec/10-realtime/10.1-overview.md`
- `docs/spec/11-security/11.8-realtime-security.md`
- `docs/spec/08-data-model/08.5-documents-submissions.md`

## Domain Sources
- `docs/domains/collab/hocuspocus.md`
- `docs/domains/collab/persistence.md`
- `docs/domains/collab/read-only-rules.md`
- `docs/domains/collab/failure-modes.md`

## Scope
- Hook responsibilities: `onLoadDocument`, `onStoreDocument`, `onConnect`, `onDisconnect`
- Authorization and read-only enforcement
- Persistence cadence and derived plaintext updates
- Failure handling for DB or collab outages

## Required Rules / Contract

### Hook: `onLoadDocument`
- Fetch and return `documents.content_yjs` for `doc:<documentId>` room.
- Validate:
  - JWT is valid and user is active/non-deleted.
  - User is active member of document’s workspace.
- If not authorized, reject connection.

### Hook: `onStoreDocument`
- Persist updated Yjs state to `documents.content_yjs`.
- Update `documents.updated_at` and `updated_by`.
- Update `documents.content_plaintext`:
  - Prefer async job if large; sync allowed for small docs.
- No per-keystroke persistence; cadence must be coalesced.

### Hook: `onConnect`
- Validate document metadata:
  - `workspaceId`, `status`, `isLocked`, `deletedAt`.
- Compute effective permission:
  - Viewer+: read-only allowed.
  - Member+: edit only if document is editable (status/lock/workspace policies).
  - If document is locked: only lock owner or Admin/Owner can edit.
- Join room `doc:<documentId>` only after auth+authorization.
- Optional: emit internal presence events (e.g., `document.collaboration_joined`).

### Hook: `onDisconnect`
- Update presence tracking (optional).
- Optional: emit `document.collaboration_left`.

### Read-only enforcement (MUST)
- Read-only users may connect and sync.
- Server MUST reject update messages for read-only users.
- Permission changes mid-session must take effect immediately (reject writes).

## Edge Cases / Failure Modes
- Collab server down → open document read-only with “Collaboration unavailable”; render last persisted snapshot if available.
- DB down → sync can continue; persistence fails; retry with degraded mode signal.
- Auth failure → reject connection.
- Permission change mid-session → next update rejected and client warned.

## Validation or Testing Notes
- Verify read-only users cannot publish updates (server-side enforcement).
- Verify persistence updates `content_yjs`, `updated_at`, `updated_by`.
- Verify derived plaintext updates on store (sync or async).
- Simulate reconnect and ensure room rejoin + re-authorization.

## Related Files / Domains
- `docs/agent-ref/collab/yjs-state-model.md`
- `docs/agent-ref/collab/read-only-rules.md`
- `docs/agent-ref/collab/collaboration-failure-modes.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/rules/security-rules.md`


