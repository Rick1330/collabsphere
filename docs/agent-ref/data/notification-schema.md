# Notification Schema (agent-ref)

## Purpose
Provide a compact, execution-focused reference for notification persistence schemas, constraints, and retention rules.

## Canonical Sources
- `docs/domains/notifications/data-model.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/notifications/events.md`
- `docs/spec/08-data-model/08.8-notifications-preferences.md`
- `docs/spec/04-user-flows/04.9-notifications.md`
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/notifications/data-model.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/notifications/events.md`

## Scope
- `notifications` table schema and indexes
- `notification_preferences` schema
- Recipient scoping and retention policy
- Validation rules for preference keys

## Required Rules / Contract

### Table: `notifications`
Purpose: Store in-app notifications.

Key fields:
- `id` UUID PK
- `recipient_id` UUID FK → users (owner)
- `workspace_id` UUID FK → workspaces (nullable for global notifications)
- `actor_id` UUID FK → users (nullable for system)
- `type` varchar(80) (e.g., `task.assigned`)
- `title` varchar(200)
- `body` text nullable
- `resource_type` varchar(40) (task|document|comment_thread|workspace|file|export)
- `resource_id` UUID nullable
- `url` varchar(500) nullable
- `metadata` jsonb
- `is_read` boolean default false
- `read_at` timestamptz nullable
- `created_at` timestamptz
- `deleted_at` timestamptz nullable (optional v1.1)

Indexes (recommended):
- `(recipient_id, created_at DESC)` where `deleted_at IS NULL`
- `(recipient_id, is_read, created_at DESC)` where `deleted_at IS NULL`
- `(recipient_id, workspace_id, created_at DESC)` where `deleted_at IS NULL`

Rules:
- Notifications are strictly queryable by `recipient_id = currentUserId`.
- `workspace_id` is for filtering only; not an authorization gate.
- Workspace-scoped notifications must include `workspace_id`; global notifications must set it to null.

### Table: `notification_preferences`
Purpose: Store per-user notification preferences.

Key fields:
- `user_id` UUID PK/FK → users
- `in_app` JSONB default `{}`
- `email` JSONB default `{}`
- `daily_digest_enabled` boolean default false
- `weekly_digest_enabled` boolean default false
- `created_at`, `updated_at`

Rules:
- Unknown preference keys MUST be rejected by API validation.
- Preference evaluation happens at dispatch time (no retroactive mutation).

### Retention & Cleanup
- Keep last **90 days OR 2,000 notifications per user**, whichever smaller.
- Cleanup via scheduled job.
- Soft delete is optional (v1.1); do not expose deleted items.

## Edge Cases / Failure Modes
- Recipient removed from workspace: keep history; stop future notifications.
- Workspace deleted: do not leak notifications across users; retention still applies.
- Notification dispatch failures (email provider) must not prevent in-app persistence.

## Validation or Testing Notes
- Enforce `recipient_id` scoping on all queries and mutations.
- Validate preference keys against canonical type list.
- Verify retention job enforcement by time and count.

## Related Files / Domains
- `docs/agent-ref/api/notification-endpoints.md`
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`


