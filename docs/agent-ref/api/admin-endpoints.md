# Admin Endpoints (agent-ref)

## Purpose
Execution-focused reference for platform admin API endpoints, access constraints, and required audit behavior.

## Canonical Sources
- `docs/domains/admin/api-contracts.md`
- `docs/domains/admin/user-management.md`
- `docs/domains/admin/workspace-management.md`
- `docs/domains/admin/audit-access.md`
- `docs/spec/05-features/05.9-admin-console.md`
- `docs/spec/05-features/05.8-activity-audit.md` — admin audit access
- `docs/spec/11-security/11.10-audit-logging.md`
- `docs/spec/09-api-standards/09.3-response-standards.md`
- `docs/spec/09-api-standards/09.4-error-standards.md`
- `docs/spec/09-api-standards/09.5-pagination.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`
- `docs/spec/18-appendices/18.1-domain-event-catalog.md`

## Domain Sources
- `docs/domains/admin/api-contracts.md`
- `docs/domains/admin/user-management.md`
- `docs/domains/admin/workspace-management.md`
- `docs/domains/admin/audit-access.md`

## Scope
- Admin-only endpoints under `/api/v1/admin/*`
- User management, workspace management, and audit log access
- Global role requirements and audit logging obligations
- Error codes and confirmation requirements for dangerous actions

## Required Rules / Contract

### Global admin guard
- All `/api/v1/admin/*` endpoints require global role `ADMIN`.
- Non-admin access MUST return `403 FORBIDDEN` (or `ADMIN_ONLY`).
- All admin actions MUST emit audit log entries.

### Endpoints

#### Admin overview
`GET /api/v1/admin/overview`
- Returns platform totals (users, workspaces, storage, jobs).

#### Users
- `GET /api/v1/admin/users`
  - Query: `page`, `pageSize`, `search`, `status=active|deactivated|unverified|deleted`, `provider=local|google`, `globalRole=USER|ADMIN`
- `GET /api/v1/admin/users/:userId`
  - Includes memberships.
- `POST /api/v1/admin/users/:userId/deactivate`
  - Side effects: revoke refresh tokens; audit `admin.user_deactivated`.
- `POST /api/v1/admin/users/:userId/reactivate`
  - Side effects: audit `admin.user_reactivated`.
- `POST /api/v1/admin/users/:userId/revoke-sessions`
  - Side effects: audit `admin.user_sessions_revoked`.

#### Workspaces
- `GET /api/v1/admin/workspaces`
  - Query: `page`, `pageSize`, `search`, `type=professional|academic|general`, `status=active|archived|deleted`
- `GET /api/v1/admin/workspaces/:workspaceId`
- `POST /api/v1/admin/workspaces/:workspaceId/archive`
  - Side effects: audit `admin.workspace_archived`.
- `POST /api/v1/admin/workspaces/:workspaceId/unarchive`
  - Side effects: audit `admin.workspace_unarchived`.
- `DELETE /api/v1/admin/workspaces/:workspaceId`
  - Side effects: soft delete; audit `admin.workspace_force_deleted`.

#### Audit log (admin-only)
`GET /api/v1/admin/audit`
- Query: `page`, `pageSize`, `severity=info|warn|error`, `actionKey=...`, `actorEmail=...`, `workspaceId=...`, `from=...&to=...`
- Audit log is immutable and append-only.

### Errors (canonical)
- `403 FORBIDDEN` / `ADMIN_ONLY`
- `404 NOT_FOUND` / `WORKSPACE_NOT_FOUND`
- `400 VALIDATION_ERROR`

### Confirmation requirements
- Dangerous actions (workspace force delete, user deactivation/role demotion) require typed confirmation of the exact workspace name or user identifier in UI.

## Edge Cases / Failure Modes
- Admin routes bypass workspace membership checks but must still log audit entries.
- Reactivated users MUST re-login; previous refresh tokens remain invalid.
- Audit log must never be editable or deletable via API.

## Validation or Testing Notes
- Verify admin guard on all routes.
- Confirm audit events are emitted with required metadata (requestId, actorId, ipAddress, userAgent).
- Ensure deactivation revokes refresh tokens and blocks refresh attempts.

## Related Files / Domains
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/activity-rules.md`
- `docs/agent-ref/data/auth-schema.md`


