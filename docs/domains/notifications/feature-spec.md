# notifications/feature-spec

## Domain
Notification types, recipient rules, channels, retention, and dispatch behavior.

## Canonical Sources
- `docs/spec/04-user-flows/04.9-notifications.md` — FL-008 Notifications (types, channels, UX, API, edge cases)
- `docs/spec/08-data-model/08.8-notifications-preferences.md` — notification tables + retention rules
- `docs/spec/05-features/05.5-tasks.md` — task reminders + notification triggers
- `docs/spec/05-features/05.6-document-task-linking.md` — “no notifications by default” for linking
- `docs/spec/05-features/05.7-files-attachments.md` — “no notify on every upload”
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — realtime delivery constraints
- `docs/spec/13-observability/13.1-overview.md` + `13.3-structured-logging.md` — logging/privacy requirements
- `docs/spec/12-errors/12.4-error-code-catalog.md` — validation errors for preferences

## Included Topics
- Notification types and recipient rules
- In-app and email channels
- Preference matrix and defaults
- Retention policy and cleanup
- Dispatch rules (event-driven, dedupe, no noise)
- Realtime payload expectations
- Security and privacy constraints

## Notification types (v1)

### Workspace-scoped
| Type Key | Trigger | Recipient(s) |
|---|---|---|
| `workspace.invite` | User invited | invited user |
| `workspace.member_joined` | Invite accepted | workspace Owner/Admin (optional) |
| `document.comment` | Comment on document | document participants/watchers + mentioned users |
| `document.mention` | Mention in document comment | mentioned user |
| `document.submitted` *(Academic)* | Document submitted | Owner/Supervisor + Admins |
| `document.review_requested_changes` *(Academic)* | Supervisor requests changes | document author(s) / policy-based |
| `document.review_approved` *(Academic)* | Supervisor approves | document author(s) |
| `task.assigned` | Task assigned | assignee |
| `task.mention` | Mention in task comment | mentioned user |
| `task.comment` | Comment on task | task participants + assignee + mentions |
| `task.due_soon` | Due within 24h | assignee (+ Manager optional) |
| `task.overdue` | Past due | assignee (+ Manager optional) |
| `workspace.announcement` | Announcement posted | all workspace members |

### Global (rare in v1)
| Type Key | Trigger | Recipient(s) |
|---|---|---|
| `platform.announcement` | Platform admin announcement | all users |
| `security.password_changed` | Password changed | that user |
| `security.new_login` *(optional)* | New login from new device | that user |

**Scope rule (MUST):**
- Workspace notifications MUST include `workspaceId`.
- Global notifications MUST have `workspaceId = null`.

## Channels (v1)
- **In-app (P0):** persisted notification record + realtime push (best-effort).
- **Email (P1):** queued worker delivery with retries; configurable per type.

### Email modes
- **Instant** (e.g., mentions, task assigned).
- **Digest** (daily/weekly summary; defaults OFF).

## Preferences matrix (v1 defaults)
- Mentions: ON/ON
- Task assigned: ON/ON
- Task due soon/overdue: ON/ON
- Comments: ON in-app, OFF email (for involved content)
- Workspace announcements: ON in-app, OFF email
- Platform announcements: ON in-app, OFF email
- Daily digest: OFF (email only)
- Weekly digest: OFF (email only)

**Rules (MUST):**
- If in-app toggle is OFF, do not create notification records of that type.
- If email toggle is OFF, do not enqueue email jobs.
- Unknown type keys MUST be rejected by API validation (spec default; choose this explicitly).

## Dispatch rules (MUST)
- Event-driven: domain services emit events; NotificationService decides recipients and channels.
- Preferences are evaluated at **dispatch time**; do not retroactively remove old notifications.
- **No noise** rules:
  - Do NOT generate notifications for document-task linking by default.
  - Do NOT notify on every file upload; only when attachment context warrants it (P2).
  - Avoid per-keystroke or overly granular notifications.
- Dedupe:
  - Use eventId idempotency to avoid duplicates.
  - Mentions in a single comment notify each user once.

## Recipient resolution (MUST)
- Must be permission-safe and workspace-scoped.
- Do not notify users who are no longer workspace members.
- Notifications are strictly queryable by `recipient_id`; `workspaceId` is for filtering, not auth.

## Retention & cleanup (MUST)
- Keep last **90 days OR 2,000 notifications per user**, whichever smaller.
- Cleanup via background job; soft delete (`deleted_at`) allowed.

## Realtime delivery (MUST)
- Room: `user:<userId>`
- Events:
  - `notification:new`
  - `notification:count`
  - `notification:read` (optional)
  - `notification:batch_read` (optional)

**Payload (notification:new)**
- id, type, workspaceId
- title, body
- url (deep link)
- actor (id, fullName, avatarUrl) if available
- resource (type, id)
- isRead, createdAt

## Security & privacy (MUST)
- Never leak cross-workspace data in notification content or delivery.
- Logs must not include sensitive content; use requestId and non-PII identifiers.
- Follow observability guidance for structured logging and metrics without exposing user data.

## Edge cases (MUST)
- Recipient removed from workspace → keep history, stop future notifications.
- Email provider failure → retry; in-app still succeeds.
- High volume → pagination + retention enforcement.
- Duplicate events → idempotency to prevent duplicate notifications.