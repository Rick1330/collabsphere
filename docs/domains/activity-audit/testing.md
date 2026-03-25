# activity-audit/testing

## Domain
Activity feed and audit log testing requirements.

## Canonical Sources
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.11 Testing Requirements; §5.8.4 activity coalescing; §5.8.5 audit log rules
- `docs/spec/11-security/11.10-audit-logging.md` — audit immutability and admin-only access
- `docs/spec/13-observability/13.3-structured-logging.md` + `13.4-metrics.md` — logging/metrics expectations
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — canonical event names/envelope
- `docs/spec/15-testing/15.6-required-test-suites.md` — activity/audit test coverage expectations

## Included Topics
- Unit tests for event-to-activity/audit mapping and coalescing
- Integration tests for API access and retention
- E2E tests for user activity feed and admin audit log
- Security/immutability tests for audit log
- Observability tests for metrics/logs without sensitive data

## Unit tests (required)
- Event mapping:
  - `task.assigned` produces activity event `task.assigned`.
  - `security.login_failed` produces audit log entry with correct `actionKey`.
- Coalescing:
  - Document edit events are coalesced to one per user/document per 5-minute window (if implemented).
  - If v1 omits `document.edited`, ensure no activity events are created for edits.
- Payload integrity:
  - Activity events include `workspaceId`, `actorId`, `eventKey`, `summary`, `resource`, `createdAt`.
  - Audit events include `requestId`, `actorEmail`, `ipAddress`, `userAgent`, `severity`, `actionKey`.

## Integration tests (required)
- Activity feed API:
  - `GET /api/v1/workspaces/:workspaceId/activity` returns workspace-scoped events only.
  - Non-member access returns `403 NOT_WORKSPACE_MEMBER`.
- Audit log API:
  - `GET /api/v1/admin/audit` requires global `ADMIN` role; non-admin returns `403 ADMIN_ONLY` or `403 FORBIDDEN`.
  - Filters by `actionKey`, `severity`, `actorEmail`, `workspaceId` work correctly.
- Retention:
  - Activity feed retention shorter (e.g., 180 days) enforced by cleanup job.
  - Audit log retention longer (365 days) enforced by cleanup job.

## E2E (Playwright)
- Activity feed:
  - Create task → activity feed shows `task.created`.
  - Assign task → activity feed shows `task.assigned`.
  - Comment created → activity feed shows `comment.created`.
- Audit log:
  - Failed login attempt appears in admin audit log.
  - Admin deactivates user → audit entry `admin.user_deactivated` recorded.

## Security & immutability tests (required)
- Audit log entries are append-only:
  - No API endpoint allows edit/delete.
  - Attempted mutation returns `403 FORBIDDEN`.
- Sensitive data handling:
  - Audit and activity logs do not contain raw tokens, presigned URLs, or raw search queries.

## Observability tests (required)
- Metrics:
  - `activity_events.created.count` increments by `event_key`.
  - `audit_log.created.count` increments by `action_key` and `severity`.
  - `activity_feed.query_latency_ms` and `audit_log.query_latency_ms` captured.
- Logs:
  - `activity_event_insert_failed` and `audit_log_insert_failed` emitted on failure without sensitive payloads.

## Edge cases (required)
- Member removed:
  - Past activity remains visible with “Former member” badge.
- User deleted:
  - Activity shows “Deleted user”; audit retains `actorEmail`.
- High volume:
  - Pagination works; no unbounded response sizes.