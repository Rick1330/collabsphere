# activity-audit/api-contracts

## Domain
Activity feed and audit log API contracts.

## Canonical Sources
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.6 API Contracts (activity + admin audit)
- `docs/spec/11-security/11.10-audit-logging.md` — audit access and immutability
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes, pagination, errors
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `ADMIN_ONLY`, `FORBIDDEN`, `NOT_WORKSPACE_MEMBER`

## Included Topics
- Activity feed endpoints (workspace-scoped)
- Admin audit log endpoint (platform admin only)
- Filtering, sorting, pagination
- Error codes and access constraints

## API standards applied
- Auth required (JWT).
- Responses use `{ data, meta }` envelope.
- Pagination uses `page` + `pageSize` (activity: 25 default; audit: 50 default).

---

## Activity Feed (workspace-scoped)

### `GET /api/v1/workspaces/:workspaceId/activity`

Query params:
- `page` (default 1)
- `pageSize` (default 25)
- `types=task.created,document.submitted` (optional, P1)
- `actorId=<uuid>` (optional, P1)

Response (200):
```coloe/docs/domains/activity-audit/api-contracts.md#L45-78
{
  "data": {
    "items": [
      {
        "id": "evt-uuid",
        "eventKey": "task.assigned",
        "summary": "Jane assigned “Implement login” to Bob",
        "actor": { "id": "u1", "fullName": "Jane", "avatarUrl": null },
        "resource": { "type": "task", "id": "t1", "title": "Implement login" },
        "createdAt": "2025-07-17T12:00:00Z"
      }
    ]
  },
  "meta": { "pagination": { "page": 1, "pageSize": 25, "totalItems": 320, "totalPages": 13 } }
}
```

Errors:
- `401 UNAUTHORIZED`
- `403 NOT_WORKSPACE_MEMBER`
- `404 WORKSPACE_NOT_FOUND`

Notes:
- Results MUST be workspace-scoped and permission-aware.
- No per-keystroke activity events; events are meaningful/coalesced.

---

## Audit Log (admin-only)

### `GET /api/v1/admin/audit`

Auth: Platform Admin only.

Query params:
- `page` (default 1)
- `pageSize` (default 50)
- `severity=info|warn|error`
- `actionKey=security.login_failed`
- `actorEmail=...`
- `workspaceId=...`
- `from=...&to=...` (date range)

Response (200):
```coloe/docs/domains/activity-audit/api-contracts.md#L93-120
{
  "data": {
    "items": [
      {
        "id": "audit-uuid",
        "severity": "warn",
        "actionKey": "security.login_failed",
        "actorEmail": "jane@example.com",
        "ipAddress": "203.0.113.10",
        "createdAt": "2025-07-17T12:00:00Z"
      }
    ]
  }
}
```

Errors:
- `401 UNAUTHORIZED`
- `403 ADMIN_ONLY` (or `FORBIDDEN` if using a single code)
- `400 VALIDATION_ERROR` (invalid filters)

Notes:
- Audit log is immutable and append-only; no edit/delete endpoints.
- Audit results are not workspace-member scoped; they are admin-only and may include `workspaceId` for filtering.

---

## Access-control rules (MUST)
- Activity feed requires active membership in the workspace.
- Audit log requires global role `ADMIN`.
- Never allow non-admin access to audit data.