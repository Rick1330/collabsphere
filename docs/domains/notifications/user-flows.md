# notifications/user-flows

## Domain
Notifications flow.

## Canonical Sources
- `docs/spec/04-user-flows/` — FL-008

## Included Topics
- Notification creation on domain events
- In-app UI behaviors
- Email enqueuing

## Flow summary
- Domain event occurs (task assigned, mention, document submitted, etc.).
- Notification service reads recipient preferences.
- If in-app enabled:
  - create notification record
  - push `notification:new` to `user:<userId>` room
  - push updated unread count
- If email enabled:
  - enqueue email job in worker queue
  - retry on failures

UI surfaces:
- bell dropdown (last 10)
- notification center `/notifications` (paginated)
