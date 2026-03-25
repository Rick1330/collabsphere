# Business Rules (agent-ref)

## Purpose
Provide a compact, execution-focused reference for domain business rules, invariants, and policy constraints required for correct implementation.

## Canonical Sources
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/documents/hierarchy.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/tasks/linking.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/files/feature-spec.md`
- `docs/domains/files/lifecycle.md`
- `docs/domains/templates/application-engine.md`
- `docs/spec/05-features/*`
- `docs/spec/02-personas-roles/*`
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/documents/hierarchy.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/tasks/linking.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/files/feature-spec.md`
- `docs/domains/files/lifecycle.md`
- `docs/domains/templates/application-engine.md`

## Scope
- Cross-domain invariants and policy rules
- Role and permission constraints with business logic
- Lifecycle rules affecting behavior (archived, deleted, submitted, locked)
- Idempotency and noise-control policies tied to business behavior

## Required Rules / Contract

### Workspace & Membership
- Exactly one active Owner per workspace at all times.
- Owner cannot be removed/demoted without ownership transfer.
- Role assignment limits:
  - Owner can assign any role.
  - Admin can assign up to Manager (cannot assign Admin/Owner).
  - Invites may assign at most one level below inviter.
- Workspace archived → **all writes blocked** with `WORKSPACE_ARCHIVED_READONLY`.
- Workspace limits (v1 defaults):
  - max workspaces per user: 20 → `WORKSPACE_LIMIT_REACHED`
  - max members per workspace: 50 → `WORKSPACE_MEMBER_LIMIT_REACHED`
  - max documents per workspace: 500 → `DOCUMENT_LIMIT_REACHED`
  - max tasks per workspace: 2,000 → `TASK_LIMIT_REACHED`
- Invitations are email-bound in v1: accept must match invited email.
- Ownership transfer:
  - `newOwnerUserId` must be existing member (Admin/Manager or elevated during transfer).
  - Previous Owner becomes Admin.

### Documents & Hierarchy
- Max folder nesting depth: 10.
- Cycle prevention on folder moves; violation → `INVALID_PARENT`.
- Deleting a non-empty folder is blocked → `FOLDER_NOT_EMPTY`.
- REST is metadata-only; editable content delivered only via collaboration server.
- Document editability requires:
  - Workspace not archived.
  - Document not deleted/archived.
  - Document not locked (unless editor is lock owner or Admin/Owner).
  - Academic status not `submitted`/`approved` for Members.
- Locking:
  - Manager+ can lock/unlock.
  - Locked documents are editable only by lock owner or Admin/Owner; all others read-only.
- Deletion:
  - Document delete is soft.
  - Disallow deletion when status is `submitted` or `approved` → `DOCUMENT_READONLY_STATUS`.
  - Permissions: Owner/Admin/Manager can delete any; Member can delete own docs only.
- Versioning:
  - No per-keystroke snapshots.
  - Restore must create `before_restore` snapshot first.
- Export:
  - Async job required; return `202 Accepted` + `exportJobId`.
  - Viewer export allowed only if `workspace_settings.settings.allowViewerExport` is true.

### Tasks
- Required fields and constraints:
  - title 1–200 chars
  - description max 10,000 chars (plain text only in v1)
  - priority `low|medium|high|urgent`
  - dueDate date-only; recommended not in past (`INVALID_DATE`)
  - labels max 10; 1–30 chars; `[a-zA-Z0-9-]`
- Status transitions must follow canonical state machine (see `tasks/status-machine.md`).
- Policy choice required for unassigned → `in_progress` and member moves of unowned tasks.
- Workspace archived blocks all writes.
- Retention: soft delete; purge after 30 days.

### Document ↔ Task Linking
- Must be same workspace; otherwise `WORKSPACE_MISMATCH`.
- Anchors are best-effort:
  - Malformed anchor → `INVALID_ANCHOR`.
  - Resolution failure → degraded navigation with banner + fallback.
- Do not generate notifications for link creation/removal by default.

### Comments & Mentions
- Comment edits/deletes allowed only by author.
- Edit windows:
  - Viewer/Member: 15 min
  - Manager: 30 min
  - Admin/Owner: 1 hour
- Mentions must reference active workspace members; invalid → `INVALID_MENTION`.
- Anchors malformed → `INVALID_ANCHOR`; resolution failure is non-fatal.

### Notifications
- Dispatch is event-driven and preference-aware at **dispatch time**.
- Preferences with unknown keys must be rejected.
- No per-keystroke notifications.
- Retention: last 90 days or 2,000 notifications per user (whichever smaller).

### Files & Attachments
- Upload/attach requires Member+; Viewer is read-only.
- Only `ready` files can be attached or downloaded; otherwise `FILE_NOT_READY`.
- Workspace archived: upload/attach blocked; download allowed with ACL checks.
- Pending uploads expire after 1 hour and must be cleaned up.
- Storage keys must be unguessable and scoped to workspace.

### Templates
- Template application must be transactional (workspace creation).
- Schema version must be validated; unsupported → `TEMPLATE_SCHEMA_UNSUPPORTED`.
- Category mismatch → `TEMPLATE_CATEGORY_MISMATCH`.

## Edge Cases / Failure Modes
- Non-member access must return `403 NOT_WORKSPACE_MEMBER` consistently.
- Role changes must take effect immediately (including realtime write rejection).
- Deactivated users must not regain access without re-login.
- Collab server down → read-only fallback; no REST content editing.

## Validation or Testing Notes
- Enforce all invariants at service layer and in DB constraints where possible.
- Add tests for role assignment limits and ownership transfer.
- Verify archived workspace blocks writes across domains.
- Test anchor degradation behavior and non-fatal UI fallbacks.
- Ensure no notifications are emitted for link creation/removal by default.

## Related Files / Domains
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/api/*-endpoints.md`
- `docs/agent-ref/data/*-schema.md`


