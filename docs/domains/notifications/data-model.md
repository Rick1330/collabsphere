# notifications/data-model

## Domain
Notifications data model (in-app notifications + user preferences).

## Canonical Sources
- `docs/spec/08-data-model/08.8-notifications-preferences.md` — notifications + notification_preferences tables
- `docs/spec/04-user-flows/04.9-notifications.md` — §4.9.12 data model, retention, and rules
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — recipient scoping rules
- `docs/spec/12-errors/12.4-error-code-catalog.md` — validation errors for preferences

## Included Topics
- `notifications` table schema and indexes
- `notification_preferences` table schema
- Recipient scoping rules (authorization)
- Retention and cleanup policies

## Table: `notifications` (authoritative)
Purpose: Store user-facing in-app notifications.

Key fields:
- `id` UUID PK
- `recipient_id` UUID FK → users (owner of the notification)
- `workspace_id` UUID FK → workspaces (nullable for global notifications)
- `actor_id` UUID FK → users (nullable for system)
- `type` varchar(80) (e.g., `task.assigned`)
- `title` varchar(200)
- `body` text nullable
- `resource_type` varchar(40) (task|document|comment_thread|workspace|file|export)
- `resource_id` UUID nullable
- `url` varchar(500) nullable (deep link)
- `metadata` jsonb (flexible extras)
- `is_read` boolean default false
- `read_at` timestamptz nullable
- `created_at` timestamptz
- `deleted_at` timestamptz nullable (optional v1.1)

Indexes (recommended):
- `(recipient_id, created_at DESC)` where `deleted_at IS NULL`
- `(recipient_id, is_read, created_at DESC)` where `deleted_at IS NULL`
- `(recipient_id, workspace_id, created_at DESC)` where `deleted_at IS NULL`

## Table: `notification_preferences` (authoritative)
Purpose: Store per-user notification preferences.

Key fields:
- `user_id` UUID PK/FK → users
- `in_app` JSONB default `{}` (per-type toggles)
- `email` JSONB default `{}` (per-type toggles)
- `daily_digest_enabled` boolean default false
- `weekly_digest_enabled` boolean default false
- `created_at`, `updated_at`

Example JSON shape:
```coloe/docs/domains/notifications/data-model.md#L1-220
{
  "task.assigned": true,
  "task.due_soon": true,
  "task.comment": false,
  "document.mention": true,
  "workspace.announcement": false
}
```

## Rules (MUST)
- Notifications are strictly queryable by `recipient_id = currentUserId`. `workspace_id` is for filtering only, not authorization.
- Unknown preference keys MUST be rejected by API validation (spec default).
- Retention: keep last **90 days OR 2,000 notifications per user**, whichever smaller; cleanup via background job.
- Soft delete is allowed (optional v1.1); do not expose deleted items in queries.

## Retention & cleanup
- Cleanup job enforces time and count limits.
- Retention applies per recipient, not globally.
- Deleting a workspace does not invalidate historical notifications automatically; apply retention policy consistently.