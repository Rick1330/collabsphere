# Domain Events (agent-ref)

## Purpose
Provide a compact, execution-focused reference for canonical domain event names, envelopes, and producer/consumer expectations for CollabSphere.

## Canonical Sources
- `docs/spec/18-appendices/18.1-domain-event-catalog.md`
- `docs/spec/05-features/05.8-activity-audit.md`
- `docs/spec/04-user-flows/04.9-notifications.md`
- `docs/spec/10-realtime/10.3-socketio-app-events.md`
- `docs/spec/11-security/11.10-audit-logging.md`
- `docs/domains/activity-audit/events.md`
- `docs/domains/notifications/events.md`

## Domain Sources
- `docs/domains/activity-audit/events.md`
- `docs/domains/notifications/events.md`

## Scope
- Canonical event envelope
- Required event names by domain
- Producer/consumer expectations
- Activity vs audit separation rules

## Required Rules / Contract

### Canonical Event Envelope (MUST)
All internal domain events follow this envelope:
- `eventId` (unique ULID/UUID)
- `name` (canonical event name)
- `occurredAt` (UTC ISO)
- `actor`:
  - `userId`
  - `workspaceId` (nullable for global)
- `data` (event-specific payload)

### Event Names (canonical, v1)

#### Auth & Security
- `user.registered`
- `user.verification_sent`
- `user.email_verified`
- `user.login_succeeded`
- `security.login_failed`
- `user.logged_out`
- `user.refresh_succeeded`
- `security.refresh_failed`
- `user.password_reset_requested`
- `user.password_reset_completed`
- `admin.user_deactivated`
- `admin.user_reactivated`

#### Workspace
- `workspace.created`
- `workspace.updated`
- `workspace.archived`
- `workspace.unarchived`
- `workspace.deleted`
- `workspace.invitation_created`
- `workspace.invitation_resent`
- `workspace.invitation_accepted`
- `workspace.member_joined`
- `workspace.member_removed`
- `workspace.member_role_changed`
- `workspace.ownership_transferred`

#### Documents
- `document.created`
- `document.renamed`
- `document.moved`
- `document.locked`
- `document.unlocked`
- `document.version_created`
- `document.version_restored`
- `document.submitted`
- `document.reviewed`
- `document.export_requested`
- `document.export_ready`

#### Tasks
- `task.created`
- `task.updated`
- `task.assigned`
- `task.status_changed`
- `task.deleted`
- `task.due_soon`
- `task.overdue`
- `task.created_from_document`

#### Comments
- `comment.thread_created`
- `comment.created`
- `comment.updated`
- `comment.deleted`
- `comment.thread_resolved`
- `comment.thread_reopened`

#### Notifications (system)
- `notification.created`
- `notification.email_enqueued`
- `notification.email_failed`

## Edge Cases / Failure Modes
- Event names must match canonical catalog exactly; do not invent new names here.
- Activity feed may coalesce events; audit log is append-only.
- Replay or duplicate events must not create duplicate notifications (use `eventId` idempotency).

## Validation or Testing Notes
- Validate event names against the canonical catalog.
- Ensure envelope fields are present for all emitted events.
- Verify `actor.workspaceId` is null for global events.
- Confirm no per-keystroke events are emitted for document edits.

## Related Files / Domains
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/events/activity-rules.md`
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`


