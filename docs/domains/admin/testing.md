
# admin/testing

## Domain
Admin testing requirements for platform-level management (users, workspaces, audit).

## Canonical Sources
- `docs/spec/05-features/05.9-admin-console.md` — §5.9.14 Testing Requirements; §5.9.8 Security Requirements
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.6.2 Admin Audit Log API; §5.8.11 Testing
- `docs/spec/11-security/11.10-audit-logging.md` — audit immutability and admin-only access
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `ADMIN_ONLY`, `FORBIDDEN`, `NOT_FOUND`
- `docs/spec/15-testing/15.6-required-test-suites.md` — admin guard and deactivation tests
- `docs/spec/13-observability/13.3-structured-logging.md` + `13.4-metrics.md` — logging/metrics expectations

## Included Topics
- Admin guard enforcement
- User management side effects (deactivation, session revocation)
- Workspace management overrides (archive/force delete)
- Audit log access and immutability
- Confirmation requirements for dangerous actions
- Observability checks for admin actions

## Unit tests (required)
- Admin guard: non-admin requests rejected with `403 FORBIDDEN` / `ADMIN_ONLY`.
- Deactivation logic:
  - sets `users.is_active=false`
  - revokes refresh tokens
  - emits audit event `admin.user_deactivated`
- Reactivation logic:
  - sets `users.is_active=true`
  - does **not** restore old refresh tokens
  - emits audit event `admin.user_reactivated`
- Session revocation:
  - revokes all refresh tokens
  - emits `admin.user_sessions_revoked`
- Confirmation rules:
  - force delete requires typed workspace name
  - admin promotions (if enabled) require typed confirmation

## Integration tests (required)
- Admin overview:
  - `GET /api/v1/admin/overview` returns stats; non-admin gets `403`.
- User management:
  - list/search users with pagination
  - deactivate user → login/refresh blocked
  - reactivate user → login allowed only after fresh login
- Workspace management:
  - list/search workspaces with filters
  - archive/unarchive via admin override works
  - force delete sets `deleted_at` and emits audit event
- Audit log:
  - `GET /api/v1/admin/audit` accessible to admin only
  - filters (`actionKey`, `severity`, `actorEmail`, `workspaceId`, date range) work

## E2E (Playwright)
- Login as admin → access admin dashboard.
- Deactivate a user → verify user cannot login or refresh.
- Archive a workspace → verify read-only banner and write blocks.
- Force delete workspace → confirmation required, audit entry recorded.
- Audit log page renders and filters correctly.

## Security & immutability tests (required)
- Admin endpoints are inaccessible to non-admin users (UI hidden + API returns `403`).
- Audit log is append-only; no edit/delete endpoints.
- Audit entries include `requestId`, `actorId`, `ipAddress`, `userAgent`.

## Observability tests (required)
- Admin action logs:
  - `admin_action_performed` emitted with requestId and target metadata
  - `admin_action_denied` emitted for non-admin attempts
- Metrics:
  - `admin.api.requests.count` increments per endpoint
  - `admin.actions.count` increments per actionKey
  - `admin.user_deactivate.count`, `admin.workspace_force_delete.count` updated

## Edge cases (required)
- Admin deactivates themselves:
  - allowed only if another admin remains (if safeguard enabled)
- Admin force deletes workspace they are not a member of:
  - allowed (admin context)
- Large datasets:
  - admin list endpoints use pagination; no full-table scans