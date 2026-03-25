# Enums (agent-ref)

## Purpose
Provide a compact, execution-focused catalog of canonical enum values used across CollabSphere domains.

## Canonical Sources
- `docs/domains/workspaces/role-model.md`
- `docs/domains/workspaces/data-model.md`
- `docs/domains/tasks/data-model.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/documents/data-model.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/files/data-model.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/activity-audit/data-model.md`
- `docs/domains/templates/data-model.md`
- `docs/spec/02-personas-roles/02.2-role-architecture.md`
- `docs/spec/05-features/05.2-workspaces.md`
- `docs/spec/05-features/05.4-documents.md`
- `docs/spec/05-features/05.5-tasks.md`
- `docs/spec/05-features/05.7-files-attachments.md`
- `docs/spec/08-data-model/08.5-documents-submissions.md`
- `docs/spec/08-data-model/08.6-tasks-columns-links.md`
- `docs/spec/08-data-model/08.8-notifications-preferences.md`
- `docs/spec/08-data-model/08.11-exports-background-jobs.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/workspaces/role-model.md`
- `docs/domains/workspaces/data-model.md`
- `docs/domains/tasks/data-model.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/documents/data-model.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/files/data-model.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/activity-audit/data-model.md`
- `docs/domains/templates/data-model.md`

## Scope
- Roles, statuses, and type enums used across API and persistence layers.
- Enum values are **exact** and must not be altered without updating canonical sources.

## Required Rules / Contract

### Global roles (users)
- `USER`
- `ADMIN`

### Workspace roles (workspace_members)
- `OWNER`
- `ADMIN`
- `MANAGER`
- `MEMBER`
- `VIEWER`

### Workspace type
- `professional`
- `academic`
- `general`

### Workspace status
- `active`
- `archived`

### Invitation status
- `pending`
- `accepted`
- `expired`
- `revoked`

### Document status
- `draft`
- `submitted`
- `changes_requested`
- `approved`
- `archived`

### Document version reason
- `manual`
- `auto`
- `submitted`
- `approved`
- `before_restore`

### Task status (v1)
- `backlog` (optional; template-enabled)
- `todo`
- `in_progress`
- `in_review`
- `done`

Optional (P2/P3):
- `cancelled`
- `archived` (system-only retention)

### Task priority
- `low`
- `medium`
- `high`
- `urgent`

### Task column status (canonical)
- Must match task status enum values.

### File status
- `pending`
- `uploaded`
- `ready`
- `failed`
- `deleted`

### Attachment target_type
- `document`
- `task`
- `comment` (optional v1.1)

### Notification type keys (v1)
Workspace-scoped:
- `workspace.invite`
- `workspace.member_joined`
- `document.comment`
- `document.mention`
- `document.submitted`
- `document.review_requested_changes`
- `document.review_approved`
- `task.assigned`
- `task.mention`
- `task.comment`
- `task.due_soon`
- `task.overdue`
- `workspace.announcement`

Global:
- `platform.announcement`
- `security.password_changed`
- `security.new_login` (optional)

### Notification channels
- `in_app`
- `email`

### Comment thread status
- `open`
- `resolved`

### Export job status
- `queued`
- `processing`
- `ready`
- `failed`

### Export format
- `pdf`
- `markdown`

### Audit severity
- `info`
- `warn`
- `error`

### Template kind
- `workspace`
- `document`

### Template category
- `professional`
- `academic`
- `general`

### Template scope (v1)
- `system`

### Template content_format (document templates)
- `markdown`
- `json`

### Auth provider
- `local`
- `google`

## Edge Cases / Failure Modes
- Enum mismatches must return `400 INVALID_ENUM_VALUE` or `400 VALIDATION_ERROR` (per validation standards).
- Optional enums (P2/P3) must not be used unless explicitly enabled by spec and feature gating.

## Validation or Testing Notes
- Enforce enum values at validation and persistence layers.
- Reject unknown notification type keys in preferences updates.
- Verify task status transitions only use allowed status values (see status machine).

## Related Files / Domains
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/data/workspace-schema.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/data/task-schema.md`
- `docs/agent-ref/data/file-schema.md`
- `docs/agent-ref/data/notification-schema.md`


