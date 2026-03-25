# Collab Hocuspocus Guardrail

## Purpose
Enforce collaboration server boundaries and safe realtime editing behavior.

## When to Use
- Any Hocuspocus, Yjs, or document editing changes.

## Required Inputs / Context
- Collab service changes or editor integration changes.

## Read First
- `docs/agent-ref/collab/hocuspocus-hooks.md`
- `docs/agent-ref/collab/read-only-rules.md`
- `docs/agent-ref/collab/collaboration-failure-modes.md`
- `AGENTS.md`

## Workflow
1. Confirm Hocuspocus is the only source of editable doc content.
2. Enforce room naming `doc:<documentId>` and JWT auth on connect/reconnect.
3. Apply read-only enforcement for locks, status, and workspace archival.
4. Ensure `onLoadDocument` loads `content_yjs` and rejects unauthorized access.
5. Ensure `onStoreDocument` persists Yjs state and derives plaintext.
6. Verify degraded-mode behavior (read-only banner + last snapshot).

## Dangerous Mistakes
- Returning CRDT content via REST.
- Allowing edits without lock/status checks.
- Per-keystroke persistence or activity emission.

## Validation Expectations
- Simulate collab outage and permission downgrade tests.
- Validate persistence and derived plaintext updates.

## Escalation Conditions
- Any unclear lock/readonly behavior or collab failure modes.

## Related Skills / References
- `guardrail/yjs-crdt-state.md`
- `guardrail/socketio-realtime.md`
- `apps/collab/AGENTS.md`
