# Notification Dispatch (agent-ref)

## Purpose
Provide execution-focused rules for notification dispatch: event mapping, recipient resolution, dedupe/idempotency, channel selection, and noise control.

## Canonical Sources
- `docs/domains/notifications/events.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/notifications/realtime.md`
- `docs/domains/notifications/data-model.md`
- `docs/spec/04-user-flows/04.9-notifications.md` — event-driven dispatch, realtime payloads
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — canonical event names and envelope
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — Socket.IO delivery context
- `docs/spec/13-observability/13.3-structured-logging.md` — logging constraints

## Domain Sources
- `docs/domains/notifications/events.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/notifications/realtime.md`
- `docs/domains/notifications/data-model.md`

## Scope
- Event → notification type mapping
- Recipient resolution rules and permission checks
- Dedupe and idempotency
- Channel selection (in-app, email)
- Noise-control constraints
- Observability requirements

## Required Rules / Contract

### Event Envelope (MUST)
All inbound domain events must follow the canonical envelope:
- `eventId`, `name`, `occurredAt`, `actor`, `data`.
Event names MUST match the canonical catalog.

### Mapping: Event → Notification Type (v1)
Examples (non-exhaustive; must align with canonical catalog):
- `workspace.invitation_created` → `workspace.invite`
- `workspace.invitation_accepted` / `workspace.member_joined` → `workspace.member_joined` (optional)
- `comment.created` with `targetType=document` → `document.comment` + `document.mention` for mentions
- `comment.created` with `targetType=task` → `task.comment` + `task.mention` for mentions
- `task.assigned` → `task.assigned`
- `task.due_soon` → `task.due_soon`
- `task.overdue` → `task.overdue`
- `document.submitted` → `document.submitted` (academic)
- `document.reviewed` → `document.review_requested_changes` or `document.review_approved`
- `security.password_changed` → `security.password_changed`

### Recipient Resolution (MUST)
- Always enforce **workspace membership** at dispatch time.
- Do not notify users who are no longer members of the workspace.
- For mentions: notify each mentioned user **once per comment**.
- For assignments: notify only the assignee.
- For comments: notify participants/watchers according to canonical rules.

### Dedupe & Idempotency (MUST)
- Use `eventId` as idempotency key: repeat events MUST NOT create duplicate notifications.
- If a user is mentioned multiple times in a single comment, notify once.
- Optional coalescing may be applied only where spec allows; do not coalesce required events.

### Channel Selection (MUST)
- Evaluate **preferences at dispatch time**.
- If in-app preference OFF, do **not** create notification records for that type.
- If email preference OFF, do **not** enqueue email.
- Unknown preference keys must be rejected at preference update time (`VALIDATION_ERROR`).

### Noise Control (MUST)
- Do NOT generate notifications for document-task linking by default.
- Do NOT notify on every file upload by default.
- Do NOT generate per-keystroke notifications.

### Delivery Guarantees
- In-app persistence is the source of truth; realtime pushes are best-effort.
- If realtime delivery fails, clients must rely on polling endpoints (every 30s in v1).

## Edge Cases / Failure Modes
- Event replay: must not create duplicates (use `eventId` idempotency).
- Membership removal between event emission and dispatch: skip notification.
- Email provider failure: in-app still succeeds; retry email per policy.
- High-volume event bursts: preserve dedupe; avoid over-notification.

## Validation or Testing Notes
- Validate event names against canonical event catalog.
- Verify dedupe on repeated events.
- Verify mention dedupe per comment.
- Verify preference checks at dispatch time.
- Ensure no sensitive content is logged; use IDs only.

## Related Files / Domains
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/events/activity-rules.md`
- `docs/agent-ref/api/notification-endpoints.md`
- `docs/agent-ref/data/notification-schema.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`


