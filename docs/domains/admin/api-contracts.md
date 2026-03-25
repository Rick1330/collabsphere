# admin/api-contracts

## Domain
Admin API contracts for platform-level management (users, workspaces, audit).

## Canonical Sources
- `docs/spec/05-features/05.9-admin-console.md` — §5.9.9 API Contracts; §5.9.2 Access Rules
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.6.2 Admin Audit Log API
- `docs/spec/11-security/11.10-audit-logging.md` — audit logging requirements
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes/pagination/errors
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `ADMIN_ONLY`, `FORBIDDEN`, `NOT_FOUND`

## Included Topics
- Admin-only endpoints under `/api/v1/admin/*`
- User management endpoints
- Workspace management endpoints
- Audit log access endpoint
- Error codes, guardrails, and confirmation requirements

## Global requirements (MUST)
- All `/api/v1/admin/*` endpoints require authentication and global role `ADMIN`.
- Non-admin access MUST return `403 FORBIDDEN` (or `ADMIN_ONLY` if used).
- All admin actions MUST be recorded in the audit log.

## Endpoints (authoritative summary)

### Admin overview
`GET /api/v1/admin/overview`

Response includes platform totals (users, workspaces, storage, jobs).

Errors:
- `403 FORBIDDEN` (non-admin)

---

### Users

#### List users
`GET /api/v1/admin/users`

Query params:
- `page`, `pageSize`
- `search` (email/name/userId)
- `status=active|deactivated|unverified|deleted`
- `provider=local|google`
- `globalRole=USER|ADMIN`

Errors:
- `403 FORBIDDEN`

#### Get user
`GET /api/v1/admin/users/:userId`

Response includes memberships list.

Errors:
- `403 FORBIDDEN`
- `404 NOT_FOUND`

#### Deactivate user
`POST /api/v1/admin/users/:userId/deactivate`

Side effects:
- revoke all refresh tokens
- audit log entry: `admin.user_deactivated`

Errors:
- `403 FORBIDDEN`
- `404 NOT_FOUND`

#### Reactivate user
`POST /api/v1/admin/users/:userId/reactivate`

Side effects:
- audit log entry: `admin.user_reactivated`

Errors:
- `403 FORBIDDEN`
- `404 NOT_FOUND`

#### Revoke user sessions
`POST /api/v1/admin/users/:userId/revoke-sessions`

Side effects:
- audit log entry: `admin.user_sessions_revoked`

Errors:
- `403 FORBIDDEN`
- `404 NOT_FOUND`

---

### Workspaces

#### List workspaces
`GET /api/v1/admin/workspaces`

Query params:
- `page`, `pageSize`
- `search` (name/workspaceId/owner email)
- `type=professional|academic|general`
- `status=active|archived|deleted`

Errors:
- `403 FORBIDDEN`

#### Get workspace
`GET /api/v1/admin/workspaces/:workspaceId`

Errors:
- `403 FORBIDDEN`
- `404 WORKSPACE_NOT_FOUND`

#### Archive / unarchive (admin override)
`POST /api/v1/admin/workspaces/:workspaceId/archive`
`POST /api/v1/admin/workspaces/:workspaceId/unarchive`

Side effects:
- audit log entries: `admin.workspace_archived` / `admin.workspace_unarchived`

Errors:
- `403 FORBIDDEN`
- `404 WORKSPACE_NOT_FOUND`

#### Force delete (danger)
`DELETE /api/v1/admin/workspaces/:workspaceId`

Side effects:
- soft delete `workspaces.deleted_at`
- audit log entry: `admin.workspace_force_deleted`
- optional purge workflow (P2)

Errors:
- `403 FORBIDDEN`
- `404 WORKSPACE_NOT_FOUND`

Confirmation:
- Requires typed confirmation of workspace name (UI requirement).

---

### Audit log (admin-only)
`GET /api/v1/admin/audit`

Query params:
- `page`, `pageSize`
- `severity=info|warn|error`
- `actionKey=security.login_failed`
- `actorEmail=...`
- `workspaceId=...`
- `from=...&to=...`

Errors:
- `403 FORBIDDEN` / `ADMIN_ONLY`
- `400 VALIDATION_ERROR` (invalid filters)

---

## Error codes (canonical)
- `403 FORBIDDEN` / `ADMIN_ONLY`
- `404 NOT_FOUND` / `WORKSPACE_NOT_FOUND`
- `400 VALIDATION_ERROR`

## Notes
- Admin endpoints are not constrained by workspace membership.
- All admin actions must emit audit log entries with requestId, actorId, ipAddress, userAgent, and target metadata.