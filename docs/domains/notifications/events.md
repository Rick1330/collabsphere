
# notifications/events

## Domain
Notifications — Events mapping, payload expectations, and deduplication rules.

## Canonical Sources
- `docs/spec/04-user-flows/04.9-notifications.md` — §4.9.10 Event-driven dispatch; §4.9.11 realtime events
- `docs/spec/05-features/05.5-tasks.md` — task events that drive notifications
- `docs/spec/05-features/05.6-document-task-linking.md` — no notifications by default for linking
- `docs/spec/05-features/05.7-files-attachments.md` — no notifications on every upload
- `docs/spec/05-features/05.8-activity-audit.md` — notification service as event consumer
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — canonical event names and envelope
- `docs/spec/12-errors/12.4-error-code-catalog.md` — preference validation errors
- `docs/spec/13-observability/13.3-structured-logging.md` — logging constraints (no sensitive payloads)

## Included Topics
- Event → notification type mapping
- Recipient resolution rules
- Dedupe and idempotency strategy
- Noise-control rules
- Observability hooks

## Event envelope (MUST)
All domain events follow the canonical envelope:
```coloe/docs/domains/notifications/events.md#L1-220
{
  "eventId": "evt_01J2...",
  "name": "task.assigned",
  "occurredAt": "2025-07-17T12:00:00Z",
  "actor": { "userId": "uuid", "workspaceId": "uuid-or-null" },
  "data": { }
}
```

## Mapping: Domain events → notification types (v1)

### Workspace events
- `workspace.invitation_created` → `workspace.invite` to invited user
- `workspace.invitation_accepted` / `workspace.member_joined` → `workspace.member_joined` to Owner/Admin (optional)

### Document events
- `comment.created` with `targetType=document` + mentions → `document.comment` (participants) + `document.mention` (mentioned users)
- `document.submitted` → `document.submitted` to Supervisor/Owner/Admins (academic)
- `document.reviewed` (decision changes) → `document.review_requested_changes` or `document.review_approved` to authors
- `document.export_ready` → optional notification to requester (if enabled)

### Task events
- `task.assigned` → `task.assigned` to assignee
- `comment.created` with `targetType=task` + mentions → `task.comment` (participants) + `task.mention` (mentioned users)
- `task.due_soon` (system) → `task.due_soon` to assignee (manager optional)
- `task.overdue` (system) → `task.overdue` to assignee (manager optional)

### Security events (global)
- `security.password_changed` → `security.password_changed` to that user
- `security.new_login` (optional) → `security.new_login` to that user

## Recipient resolution (MUST)
- Always enforce workspace membership at dispatch time.
- Do not notify users who are no longer workspace members.
- For comments, notify:
  - mentioned users once per comment
  - participants/watchers according to canonical rules
- For assignments, notify only the assignee (not the whole workspace).

## Dedupe & idempotency (MUST)
- Use `eventId` as an idempotency key: repeated events MUST NOT create duplicate notifications.
- Mention dedupe: if a user is mentioned multiple times in the same comment, notify once.
- Optional: coalesce repeated notifications of same type within a short window (e.g., repeated task updates), but only if spec allows.

## Noise control rules (MUST)
- Do NOT emit notifications for document-task linking by default.
- Do NOT notify on every file upload (only when attachment context warrants it, P2).
- Do NOT generate notifications per keystroke or per minor edit.
- Activity feed and notifications are distinct; avoid double-counting noise.

## Error handling
- Unknown notification preference keys → reject update with `400 VALIDATION_ERROR`.
- If dispatch fails (email provider), in-app notification must still be created (if enabled).

## Observability (MUST)
- Log `notification_created` with non-sensitive identifiers only (no raw content).
- Log preference skips (`notification_dispatch_skipped_preference`).
- Track metrics: created count by type/channel, email enqueue/failure, realtime push latency.

## Traceability notes
- Event names must align with `docs/spec/18-appendices/18.1-domain-event-catalog.md`.
- If an event is not listed there, do not add it here; update canonical spec first.