# notifications/testing

## Domain
Notifications testing requirements (unit, integration, E2E, and observability).

## Canonical Sources
- `docs/spec/04-user-flows/04.9-notifications.md` — §4.9.15 Edge cases; §4.9.16 Observability; §4.9.14 API contracts
- `docs/spec/05-features/05.5-tasks.md` — task reminders + notification triggers
- `docs/spec/05-features/05.6-document-task-linking.md` — no notifications by default for linking
- `docs/spec/05-features/05.7-files-attachments.md` — no notifications on every upload
- `docs/spec/08-data-model/08.8-notifications-preferences.md` — data model + retention rules
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — realtime delivery behavior
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — recipient scoping rules
- `docs/spec/13-observability/13.3-structured-logging.md` + `13.4-metrics.md` — logging/metrics requirements
- `docs/spec/15-testing/15.6-required-test-suites.md` — notifications suite expectations

## Included Topics
- Unit tests for dispatch, preferences, and dedupe
- Integration tests for API + DB + queue + realtime
- E2E tests for UX flows
- Security/privacy tests
- Observability tests

## Unit tests (required)
- Preference evaluation:
  - in-app OFF → no notification record created
  - email OFF → no email job enqueued
  - unknown preference keys → `400 VALIDATION_ERROR`
- Dedupe:
  - same `eventId` processed twice → only one notification record
  - mention dedupe: same user mentioned multiple times in one comment → single notification
- Noise control:
  - document-task linking emits no notifications by default
  - file upload emits no notification by default
- Recipient resolution:
  - removed member is excluded from future notifications
  - notification recipient must be the intended user only (no broadcast)

## Integration tests (required)
- API contracts:
  - `GET /api/v1/notifications` supports filters and pagination
  - `GET /api/v1/notifications/unread-count` returns correct count
  - `PATCH /api/v1/notifications/:id/read` marks read and sets `readAt`
  - `PATCH /api/v1/notifications/mark-all-read` updates all
  - `GET/PUT /api/v1/notification-preferences` round-trips correctly
- Dispatch pipeline:
  - `task.assigned` emits notification + realtime push
  - comment mention emits notification + (optional) email job
  - email job failure does not block in-app notification creation
- Retention:
  - cleanup job enforces “90 days OR 2,000 per user” rule
  - deleted notifications are not returned in list queries

## E2E (Playwright)
- Assignment notification:
  - assign task → assignee sees bell badge increment + notification in dropdown
- Mention notification:
  - comment with @mention → mentioned user receives in-app notification
- Preferences:
  - toggle off `task.comment` in-app → new task comment does not appear
  - toggle on email → email job queued (mock queue)
- Notification center:
  - list shows pagination + filters
  - mark one read and verify unread count updates
  - mark all read from dropdown
- Realtime fallback:
  - simulate Socket.IO failure → polling still updates notification list

## Security & privacy tests (required)
- Authorization:
  - user cannot list/mark notifications belonging to another user (403/404)
  - `workspaceId` filter does not bypass `recipient_id` scoping
- Isolation:
  - no cross-workspace content in notification payload for same user
- Logging:
  - logs do not include sensitive content (raw queries, secrets)

## Observability tests (required)
- Metrics:
  - `notifications.created.count` increments by type/channel
  - `notifications.realtime.push_latency_ms` recorded
  - `email.jobs.enqueued.count` increments on email dispatch
- Logs:
  - `notification_created` includes requestId, recipientId, type (no sensitive content)
  - `notification_dispatch_skipped_preference` emitted when preferences block dispatch