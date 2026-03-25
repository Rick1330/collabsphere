# Security Rules (agent-ref)

## Purpose
Provide an execution-focused reference for security rules across authentication, authorization, realtime, file access, and data isolation.

## Canonical Sources
- `docs/domains/auth/security.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/files/security.md`
- `docs/domains/collab/read-only-rules.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/spec/11-security/11.3-authentication-security.md`
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md`
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md`
- `docs/spec/11-security/11.6-rate-limits-abuse-prevention.md`
- `docs/spec/11-security/11.7-cors-csrf-headers.md`
- `docs/spec/11-security/11.8-realtime-security.md`
- `docs/spec/11-security/11.9-file-security.md`
- `docs/spec/11-security/11.10-audit-logging.md`
- `docs/spec/09-api-standards/09.7-auth-standards.md`
- `docs/spec/09-api-standards/09.8-authorization.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/auth/security.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/files/security.md`
- `docs/domains/collab/read-only-rules.md`
- `docs/domains/notifications/feature-spec.md`

## Scope
- Auth/session security requirements
- RBAC and workspace isolation enforcement
- Realtime authorization (Socket.IO and Hocuspocus)
- File access security and presigned URL rules
- Sanitization and input validation security requirements
- Audit logging requirements for sensitive actions

## Required Rules / Contract

### Authentication & Sessions
- Passwords MUST be hashed with **bcrypt** (cost 12 in v1).
- Tokens MUST be stored as hashes only (verification/reset/refresh).
- Refresh token MUST be delivered via httpOnly cookie (recommended).
- Refresh tokens MUST rotate on every refresh request.
- Deactivated accounts MUST fail refresh and sensitive access checks.

### OAuth
- Authorization Code flow only.
- MUST validate `state` parameter (anti-CSRF).
- Redirect URIs MUST be allowlisted; never accept arbitrary redirects.
- Minimal scopes only (`openid`, `email`, `profile`).
- No silent account linking in v1.

### Authorization (RBAC)
- Every workspace route MUST validate:
  1) authenticated user
  2) workspace exists and not deleted
  3) active workspace membership
  4) minimum role required for action
  5) workspace not archived for writes
- Workspace roles: `OWNER > ADMIN > MANAGER > MEMBER > VIEWER`.
- Global admin routes require global role `ADMIN`.

### Workspace Isolation (MUST)
- All workspace-owned entities MUST include `workspace_id`.
- All reads/writes MUST filter by `workspace_id` and active membership.
- Resource IDs alone MUST NOT grant access (IDOR prevention).
- Search, notifications, and activity feeds MUST be workspace-scoped (admin global search is a controlled exception under `/api/v1/admin/*`).
- Derived indexes MUST preserve workspace scoping end-to-end.
- Authenticated non-members MUST receive `403 NOT_WORKSPACE_MEMBER` (v1 policy).

### Realtime Security
- Socket.IO:
  - JWT required at connect.
  - Rooms must be authorized on join and rejoin.
  - `user:<userId>` room: user can only join their own room.
  - `workspace:<workspaceId>` room: requires active membership.
- Hocuspocus:
  - JWT required; verify user active/non-deleted.
  - Room `doc:<documentId>` requires workspace membership.
  - Read-only users may connect; server MUST reject update messages.
  - Permission changes mid-session MUST take effect immediately.

### File Security
- Upload intent MUST enforce MIME allowlist and size limits server-side.
- Storage key MUST be unguessable and scoped to workspace.
- Presigned upload URLs MUST expire quickly (5–15 minutes).
- Download URLs MUST be short-lived (1–5 minutes) and issued only after re-checking membership and ACL.
- Download endpoints MUST re-check membership at access time.
- Never log presigned URLs or object keys; log opaque IDs only.

### Input Validation & Sanitization
- Sanitize user-generated content on client and server (allowlist only).
- Strip scripts, event handlers, and unsafe URLs (e.g., `javascript:`).
- Never store raw HTML as canonical content.
- Malformed JSON payloads return `INVALID_JSON`.

### Rate Limiting & Abuse Prevention
- Auth endpoints: strict per spec (e.g., login 10/min per IP).
- Read endpoints: baseline 120/min/user.
- Write endpoints: baseline 30/min/user.
- Return `429 RATE_LIMITED` with `Retry-After`.

### Audit Logging (MUST)
- Admin actions MUST emit audit log entries.
- Auth/security events MUST include IP and user agent.
- Audit log is append-only and admin-only.

## Edge Cases / Failure Modes
- Non-member access must return `403 NOT_WORKSPACE_MEMBER` consistently (no 404 for authenticated users).
- Cached authorizations MUST NOT bypass current membership checks.
- Collab server down → read-only fallback; no REST content editing.
- Storage provider outage → return `STORAGE_UNAVAILABLE`.

## Validation or Testing Notes
- IDOR tests across all entity types.
- Realtime join tests for room authorization.
- Refresh token rotation and deactivation blocking.
- File download access re-checks.
- Sanitization tests against XSS payloads.

## Related Files / Domains
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/api/*-endpoints.md`
- `docs/agent-ref/data/*-schema.md`


