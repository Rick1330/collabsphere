# collab/awareness-presence

## Domain
Awareness (presence/cursors) for collaborative editing.

## Canonical Sources
- `docs/spec/10-realtime/` — awareness responsibilities
- `docs/spec/05-features/` — collaboration UI elements
- `docs/spec/06-nfrs/` — latency targets

## Included Topics
- Presence avatar rules
- Cursor rules (P1)
- Awareness payload expectations

## Presence UI
- Show active collaborator avatars (cap at 5 + overflow).

## Cursors (P1)
- Each collaborator has stable color per workspace.
- Cursor label shows display name.

## Latency target
- Presence/cursor updates propagate <500ms under normal conditions.

## Notes
Awareness state is ephemeral and not persisted.
