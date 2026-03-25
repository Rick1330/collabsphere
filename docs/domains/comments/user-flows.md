# comments/user-flows

## Domain
Commenting and mentions flow.

## Canonical Sources
- `docs/spec/04-user-flows/` — FL-007

## Included Topics
- Create comment thread
- Mention user(s)
- Realtime propagation

## Flow summary
- User creates comment on document/task.
- Backend persists thread/comment and mention links.
- Backend emits realtime event so other clients see comment instantly.
- Mentioned users receive notifications.

Anchored comments:
- Anchor stored as best-effort JSON.
- If anchor invalid after edits, thread remains accessible with “Original text changed” state.
