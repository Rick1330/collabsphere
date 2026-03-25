# Collab — Agent Execution Reference

## Purpose
Provide a compact, execution-focused index of collaboration rules, payloads, and failure handling for AI agents and implementers.

## Canonical Sources
- `docs/domains/collab/README.md`
- `docs/domains/collab/overview.md`
- `docs/domains/collab/hocuspocus.md`
- `docs/domains/collab/yjs.md`
- `docs/domains/collab/persistence.md`
- `docs/domains/collab/read-only-rules.md`
- `docs/domains/collab/awareness-presence.md`
- `docs/domains/collab/failure-modes.md`
- `docs/spec/10-realtime/10.1-overview.md`
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md`
- `docs/spec/10-realtime/10.3-socketio-app-events.md`
- `docs/spec/11-security/11.8-realtime-security.md`

## Domain Sources
- `docs/domains/collab/README.md`
- `docs/domains/collab/overview.md`
- `docs/domains/collab/hocuspocus.md`
- `docs/domains/collab/yjs.md`
- `docs/domains/collab/persistence.md`
- `docs/domains/collab/read-only-rules.md`
- `docs/domains/collab/awareness-presence.md`
- `docs/domains/collab/failure-modes.md`

## Scope
- Hocuspocus/Yjs collaboration server behavior
- Read-only enforcement rules
- Presence/awareness payload expectations
- Persistence cadence and plaintext derivation
- Failure modes and degraded UX
- Explicit boundary: REST metadata only; content editing via collaboration server

## Required Rules / Contract
- Two realtime systems: Hocuspocus for document CRDT sync; Socket.IO for app events.
- REST MUST NOT deliver editable CRDT/Yjs content.
- Hocuspocus rooms: `doc:<documentId>`.
- JWT auth required; validate user active/non-deleted.
- Authorization must validate workspace membership and document editability.
- Read-only clients may connect but MUST be blocked from publishing updates.
- Persistence uses `onLoadDocument`/`onStoreDocument`; no per-keystroke persistence.
- Derived plaintext for search must be updated on persistence (sync or async).

## Edge Cases / Failure Modes
- Collab server down → read-only banner + retry.
- DB down → sync continues; persistence fails; retry and surface degraded mode.
- Permission changes mid-session → reject updates immediately.

## Validation or Testing Notes
- Multi-client edit sync.
- Read-only enforcement server-side.
- Reconnect behavior and room rejoin.
- Persistence cadence and plaintext update correctness.

## Related Files / Domains
- `collab/tiptap-capabilities.md`
- `collab/yjs-state-model.md`
- `collab/hocuspocus-hooks.md`
- `collab/awareness-presence.md`
- `collab/read-only-rules.md`
- `collab/collaboration-failure-modes.md`
- `documents` (metadata, locks, versions)
- `events` (activity/notifications boundaries)