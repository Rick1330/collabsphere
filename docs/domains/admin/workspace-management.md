
# admin/workspace-management

## Domain
Admin workspace management: platform-admin capabilities for viewing, archiving, and force-deleting workspaces, plus safety controls and audit logging.

## Canonical Sources
- `docs/spec/05-features/05.9-admin-console.md` — §5.9.6 Workspace Management; §5.9.8 Security Requirements; §5.9.9 API Contracts; §5.9.11 Events Emitted
- `docs/spec/05-features/05.2-workspaces.md` — workspace lifecycle rules (archive/delete semantics)
- `docs/spec/11-security/11.10-audit-logging.md` — audit logging requirements
- `docs/spec/12-errors/12.4-error-code-catalog.md` — admin and workspace error codes
- `docs/spec/15-testing/15.6-required-test-suites.md` — admin test coverage

## Included Topics
- Admin workspace list/detail capabilities
- Archive/unarchive overrides
- Force delete behavior and side effects
- Confirmation requirements for dangerous actions
- Audit logging requirements
- Error codes and guardrails
- Testing requirements

## Admin scope (MUST)
- All admin workspace management routes are under `/admin/*`.
- Access requires global role `ADMIN` and must return `403 FORBIDDEN` for non-admin users.
- Admin actions are **not** constrained by workspace membership (admin context).

## Workspace list (Admin)
Route: `/admin/workspaces`

Capabilities:
- Search by workspace name, workspaceId, owner email.
- Filters: type (professional|academic|general), status (active|archived|deleted).
- Columns: workspace name + icon, type, owner, member count (P2), createdAt, updatedAt.
- Pagination: 50/page default (server-side).

## Workspace detail (Admin)
Route: `/admin/workspaces/:workspaceId`

Displays:
- Workspace info (id, name, description, type, status, owner).
- Members list (read-only).
- Content counts (P2: documents/tasks/files).

Admin actions:
- Archive / unarchive (override).
- Force delete workspace (danger; confirmation required).
- Optional v1.1: transfer ownership (admin override).

## Archive / Unarchive (Admin override)
- Allowed regardless of admin membership in the workspace.
- Must log audit event: `admin.workspace_archived` / `admin.workspace_unarchived`.

## Force delete (Danger)
- `DELETE /api/v1/admin/workspaces/:workspaceId`
- Behavior:
  - sets `workspaces.deleted_at` (soft delete)
  - optionally triggers background purge (P2)
- Must log audit event: `admin.workspace_force_deleted`.
- Dangerous action confirmation required (type **workspace name**).

## Confirmation requirements (MUST)
Per canonical security requirements:
- Force delete workspace: type exact workspace name to confirm.

## Audit logging (MUST)
Every admin action must write an audit log entry with:
- `actionKey`, `actorId`, `ipAddress`, `userAgent`, `targetType`, `targetId`, `requestId`.

## Error codes (canonical)
- `403 FORBIDDEN` (non-admin)
- `404 WORKSPACE_NOT_FOUND`
- `400 VALIDATION_ERROR` (invalid filters or payloads)

## Events (internal bus)
- `admin.workspace_archived`
- `admin.workspace_unarchived`
- `admin.workspace_force_deleted`

All must also create audit log entries.

## Edge cases (MUST)
- Admin force deletes a workspace they are not a member of → allowed.
- Large user base → endpoints must be indexed and paginated; no full table scans.
- Audit log growth → retention and partitioning (P2) enforced.

## Testing requirements (MUST)
- Admin guard enforcement: non-admin requests return `403 FORBIDDEN`.
- Archive/unarchive flows succeed and emit audit events.
- Force delete workflow requires confirmation and emits `admin.workspace_force_deleted`.
- Admin workspace list/search pagination works correctly.