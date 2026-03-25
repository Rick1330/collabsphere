# admin/audit-access

## Domain
Admin audit log access constraints and safeguards.

## Canonical Sources
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.5 Audit Logging; §5.8.6.2 Admin Audit Log API
- `docs/spec/05-features/05.9-admin-console.md` — §5.9 Admin Console access rules; §5.9.8 Admin security requirements
- `docs/spec/11-security/11.10-audit-logging.md` — audit logging immutability and access constraints
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes, pagination, errors
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `ADMIN_ONLY`, `FORBIDDEN`, `VALIDATION_ERROR`

## Included Topics
- Admin-only access control rules
- Audit log query scopes and filters
- Immutability guarantees
- Safe handling of sensitive fields
- Audit access observability and logging
- Error handling and guardrails

## Access control (MUST)
- Audit log access is **Platform Admin only** (global role `ADMIN`).
- All `/admin/audit` UI routes and `/api/v1/admin/audit` endpoints MUST enforce:
  - authentication (valid JWT)
  - global role `ADMIN`
- Non-admin access MUST return `403 FORBIDDEN` (or `ADMIN_ONLY` if using a dedicated code).
- Workspace membership does **not** grant audit access.

## Immutability (MUST)
- Audit log is append-only.
- No API endpoints for edit or delete.
- Retention-based expunge only (per spec policy), never via UI.

## Query scope & filters (MUST)
- Admins may filter by:
  - `actionKey`
  - `severity`
  - `actorEmail`
  - `workspaceId`
  - date range (`from`, `to`)
- Pagination defaults to 50 per page (server-side).
- Results are not workspace-scoped; `workspaceId` is a filter only.

## Sensitive data handling (MUST)
- Audit entries MUST NOT contain:
  - raw tokens
  - passwords
  - presigned URLs
  - raw search queries
- If sensitive values are required for debugging, store only redacted or hashed variants.

## Required fields (MUST)
Audit entries must include:
- `requestId`
- `severity`
- `actionKey`
- `actorId` (nullable)
- `actorEmail`
- `actorGlobalRole`
- `workspaceId` (nullable)
- `targetType`, `targetId` (nullable)
- `ipAddress`
- `userAgent`
- `createdAt`
- `metadata` (JSONB)

## Error handling
- `403 FORBIDDEN` / `ADMIN_ONLY` — non-admin access
- `400 VALIDATION_ERROR` — invalid filters or payloads
- `401 UNAUTHORIZED` — missing/invalid auth

## Observability (MUST)
- Log every admin audit query with requestId, adminId, filters used (no sensitive content).
- Emit metrics:
  - `audit_log.query_latency_ms`
  - `audit_log.query_count`
  - `audit_log.query_error_count`

## Safety guardrails
- Audit access must be prominently labeled as sensitive.
- UI should display a warning banner: “Audit log contains sensitive security events.”
- Any export functionality (P2) must be admin-only and tamper-evident.

## Traceability notes
- Event names and payloads must match `docs/spec/18-appendices/18.1-domain-event-catalog.md`.
- If any new audit event types are needed, update canonical spec first.