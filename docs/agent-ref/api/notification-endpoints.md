# Notification Endpoints (agent-ref)

## Purpose
Provide an execution-focused reference for notification REST endpoints, including routes, auth requirements, request/response shapes, error codes, and invariants.

## Canonical Sources
- `docs/domains/notifications/api-contracts.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/notifications/realtime.md`
- `docs/domains/notifications/data-model.md`
- `docs/spec/04-user-flows/04.9-notifications.md` — §4.9.14 API contracts, §4.9.11 realtime events
- `docs/spec/09-api-standards/09.3-response-standards.md` — envelopes
- `docs/spec/09-api-standards/09.4-error-standards.md` — error envelope
- `docs/spec/09-api-standards/09.5-pagination.md` — pagination
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes

## Domain Sources
- `docs/domains/notifications/api-contracts.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/notifications/realtime.md`
- `docs/domains/notifications/data-model.md`

## Scope
- List notifications and unread count
- Mark read / mark all read
- Notification preferences read/update
- Authorization and recipient scoping rules
- Error codes and invariants

## Required Rules / Contract

### Base
- Base path: `/api/v1`
- Auth required (JWT).
- Notifications are strictly queryable by `recipient_id = currentUserId`.
- `workspaceId` is a filter, not an authorization gate.

### Endpoints (authoritative)

#### 1) Unread count
`GET /api/v1/notifications/unread-count`
- Response: `{ data: { unreadCount: number } }`
- Errors: `401 UNAUTHORIZED`

#### 2) List notifications
`GET /api/v1/notifications`
Query params:
- `page` (default 1)
- `pageSize` (default 25)
- `unreadOnly=true|false`
- `workspaceId=<uuid>` (optional filter)
- `types=task.assigned,document.mention` (optional filter)

Response:
- Standard list envelope with items and pagination.

Errors:
- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR` (bad params)

#### 3) Mark notification as read
`PATCH /api/v1/notifications/:id/read`
Request:
- `{ "isRead": true }`

Response:
- `{ data: { id, isRead: true, readAt } }`

Errors:
- `401 UNAUTHORIZED`
- `403 FORBIDDEN` (attempt to modify other user’s notification)
- `404 NOT_FOUND` (if not owned by user)

#### 4) Mark all as read
`PATCH /api/v1/notifications/mark-all-read`
Response:
- `{ data: { updatedCount } }`

Errors:
- `401 UNAUTHORIZED`

#### 5) Get notification preferences
`GET /api/v1/notification-preferences`
Response:
- `{ data: { inApp: {...}, email: {...}, dailyDigestEnabled, weeklyDigestEnabled } }`

Errors:
- `401 UNAUTHORIZED`

#### 6) Update notification preferences
`PUT /api/v1/notification-preferences`
Request:
- `{ inApp: {...}, email: {...}, dailyDigestEnabled, weeklyDigestEnabled }`

Errors:
- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR` (unknown keys or invalid payload)

### Invariants
- Preferences with unknown type keys MUST be rejected.
- Recipient scoping is mandatory on all queries and mutations.
- Retention: keep last **90 days OR 2,000 notifications per user**, whichever is smaller.

## Edge Cases / Failure Modes
- Attempt to read/update another user’s notification must return `403 FORBIDDEN` or `404 NOT_FOUND` per policy, and must never leak ownership.
- If Socket.IO delivery fails, in-app persistence still succeeds; clients must fall back to polling every 30s.
- Workspace-scoped notifications must not be returned to non-members.

## Validation or Testing Notes
- Validate pagination params and filter types.
- Verify `recipient_id` scoping on all list/update endpoints.
- Ensure unread count and list endpoints respect `unreadOnly` filter.
- Confirm preferences reject unknown keys and preserve defaults.

## Related Files / Domains
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/data/notification-schema.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`


