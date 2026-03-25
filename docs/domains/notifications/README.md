# notifications/README

## Domain
Notifications domain: in-app notification records, realtime delivery via Socket.IO, email delivery via worker/queue, notification preferences, retention, and notification event payloads.

## Canonical Sources
- `docs/spec/04-user-flows/04.9-notifications.md` — FL-008 Notifications
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8 Notifications types/channels
- `docs/spec/08-data-model/08.8-notifications-preferences.md` — notifications + notification_preferences tables
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — Socket.IO app events; notification rooms
- `docs/spec/12-errors/12.4-error-code-catalog.md` — validation codes
- `docs/spec/15-testing/15.6-required-test-suites.md` — notification tests
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — §18.1.7 Notification events

## Included Topics
- Notification types and recipient rules
- In-app delivery (DB + realtime push)
- Email delivery (queue + retries)
- Preferences matrix and enforcement rules
- Realtime payload schema
- Data model and indexes
- Testing requirements

## Related domains
- `comments/` (mentions → notifications)
- `tasks/` (assignment and reminder notifications)
- `documents/` (submission/review notifications)
- `activity-audit/` (activity is distinct from notifications)
- `quality/` (observability for delivery)
