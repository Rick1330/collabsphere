# AGENTS.md

## Purpose
Local rules for the Hocuspocus collaboration server.

## Scope
`apps/collab` realtime document collaboration, Yjs persistence, and awareness.

## Must Follow
- Hocuspocus is the only source of editable document content; REST is metadata-only.
- Yjs state is canonical document content; persist via Hocuspocus hooks.
- Room naming: `doc:<documentId>` only.
- JWT auth required on every connect/reconnect; enforce active membership before join.
- Read-only enforcement is server-side; honor lock, status, and workspace policies.
- Hook responsibilities:
  - `onLoadDocument`: load `documents.content_yjs` for `doc:<documentId>`, reject if unauthorized.
  - `onStoreDocument`: persist Yjs state, update `updated_at/updated_by`, derive `content_plaintext`.
  - `onConnect`: recheck doc status/lock/deleted state and permissions.
  - `onDisconnect`: update presence if tracked.
- Persist Yjs state on a coalesced cadence (no per-keystroke persistence).
- `content_plaintext` is derived from Yjs; never treat it as source.
- Awareness/presence is ephemeral; do not persist awareness state.
- Degraded mode: read-only banner + retry; render last persisted snapshot if available.

## Never Do
- Allow edits without valid membership and role.
- Serve or accept document content over REST.
- Emit per-keystroke activity or notification events.
- Persist per-keystroke Yjs updates.
- Accept room names other than `doc:<documentId>`.

## Tests / Validation
- Verify read-only enforcement and mid-session permission changes.
- Simulate collab outages and confirm degraded behavior.
- Validate persistence hooks update Yjs state and plaintext correctly.
- Verify reconnect re-authorizes and rechecks lock/submission status.

## Wrong vs Right (Examples)
- Wrong: “Fetch doc content via REST and pass to editor.”  
  Right: “Load Yjs state via Hocuspocus (`onLoadDocument`) and sync in room.”
- Wrong: “Allow updates if user is member.”  
  Right: “Allow updates only if member AND doc is editable (lock/status/workspace).”

## References
- `docs/agent-ref/collab/hocuspocus-hooks.md`
- `docs/agent-ref/collab/read-only-rules.md`
- `docs/agent-ref/collab/yjs-state-model.md`
- `docs/agent-ref/collab/awareness-presence.md`
- `docs/agent-ref/collab/collaboration-failure-modes.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/security-rules.md`
