# Awareness & Presence (agent-ref)

## Purpose
Provide execution-focused rules for collaboration presence/awareness payloads, UI behaviors, and latency expectations.

## Canonical Sources
- `docs/domains/collab/awareness-presence.md`
- `docs/domains/collab/hocuspocus.md`
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md`
- `docs/spec/06-nfrs/06.2-performance.md`

## Domain Sources
- `docs/domains/collab/awareness-presence.md`
- `docs/domains/collab/hocuspocus.md`

## Scope
- Presence (who is viewing) and awareness payloads
- Cursor rules and display behaviors (P1)
- Latency targets and ephemerality constraints
- Room scoping and access constraints

## Required Rules / Contract
- Awareness state is **ephemeral** and must not be persisted to DB.
- Presence updates are scoped to Hocuspocus room `doc:<documentId>`.
- Only authenticated and authorized workspace members may join rooms.
- Presence UI:
  - Show active collaborator avatars (cap at 5 + overflow).
  - Display names and avatars must match current user profile data.
- Cursors (P1):
  - Stable color per workspace user.
  - Cursor label shows display name.
- Latency target:
  - Presence/cursor updates propagate under **500ms** in normal conditions.

## Edge Cases / Failure Modes
- Collab server down → presence unavailable; show “Collaboration unavailable” banner and retry.
- Reconnects require rejoining the room; presence may briefly disappear and reappear.
- Permission changes mid-session: user remains connected but must be restricted to read-only if policy changes.

## Validation or Testing Notes
- Multi-client presence: verify join/leave updates and avatar counts.
- Cursor visibility: verify user-specific colors and labels.
- Ensure no awareness data is persisted or logged with sensitive content.

## Related Files / Domains
- `docs/agent-ref/collab/hocuspocus-hooks.md`
- `docs/agent-ref/collab/read-only-rules.md`
- `docs/agent-ref/collab/collaboration-failure-modes.md`
- `docs/agent-ref/events/socket-events.md`


