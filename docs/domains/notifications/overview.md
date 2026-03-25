# notifications/overview

## Domain
Notifications overview.

## Canonical Sources
- `docs/spec/04-user-flows/` — FL-008
- `docs/spec/05-features/` — notifications types/channels

## Included Topics
- Notification goals
- Channels
- Scoping rules

## Channels
- In-app (P0): persisted + realtime push
- Email (P1): queued + retries; user-configurable

## Scoping
- Workspace-scoped notifications include `workspaceId`.
- Global notifications have `workspaceId=null`.

## Reliability
- In-app is considered delivered once persisted; realtime push is best-effort.
- Email delivery is best-effort with retries.
