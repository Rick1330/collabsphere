# Error Codes (agent-ref)

## Purpose
Provide a compact, execution-focused reference of canonical error codes, their HTTP status classes, and required usage rules.

## Canonical Sources
- `docs/spec/12-errors/12.4-error-code-catalog.md`
- `docs/spec/09-api-standards/09.4-error-standards.md`
- `docs/spec/09-api-standards/09.8-authorization.md`
- `docs/domains/auth/errors-edge-cases.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/files/feature-spec.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`

## Domain Sources
- `docs/domains/auth/errors-edge-cases.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/files/feature-spec.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`

## Scope
- Canonical error codes across all domains.
- HTTP status mapping and envelope rules.
- Privacy and non-enumeration requirements.
- Consistency rules for non-member access (`403 NOT_WORKSPACE_MEMBER`).

## Required Rules / Contract

### Error Envelope (MUST)
All errors use the canonical envelope:
- `error.code` (stable, machine-readable)
- `error.message` (human-readable)
- `error.details` (optional; for validation)
- `error.requestId`
- `error.timestamp`

Never return stack traces or internal IDs.

### 400 — Validation Errors
- `VALIDATION_ERROR`
- `INVALID_EMAIL`
- `PASSWORD_TOO_WEAK`
- `INVALID_CREDENTIALS`
- `PASSWORD_SAME_AS_CURRENT`
- `INVALID_DATE`
- `INVALID_ENUM_VALUE`
- `INVALID_JSON`
- `INVALID_ANCHOR`
- `INVALID_MENTION`
- `INVALID_ASSIGNEE`
- `INVALID_LABEL`
- `INVALID_PARENT`
- `INVALID_NEW_OWNER`
- `INVALID_FILE_TYPE`
- `FILE_TOO_LARGE`
- `CHECKSUM_MISMATCH`
- `TEMPLATE_CATEGORY_MISMATCH`
- `TEMPLATE_INVALID`
- `TEMPLATE_SCHEMA_UNSUPPORTED`

### 401 — Authentication Errors
- `UNAUTHORIZED`
- `TOKEN_EXPIRED`
- `TOKEN_INVALID`
- `REFRESH_TOKEN_MISSING`
- `REFRESH_TOKEN_INVALID`
- `OAUTH_INVALID_CALLBACK`
- `OAUTH_STATE_MISMATCH`

### 403 — Authorization / Account State
- `FORBIDDEN`
- `NOT_WORKSPACE_MEMBER`
- `INSUFFICIENT_ROLE`
- `FORBIDDEN_ROLE_ASSIGNMENT`
- `ACCOUNT_DEACTIVATED`
- `EMAIL_NOT_VERIFIED`
- `EDIT_WINDOW_EXPIRED`
- `WORKSPACE_ARCHIVED_READONLY`
- `WORKSPACE_NOT_ACADEMIC`
- `OAUTH_USER_NO_PASSWORD`
- `DOCUMENT_LOCKED`
- `DOCUMENT_READONLY_STATUS`
- `TEMPLATE_DISABLED`
- `EMAIL_MISMATCH`
- `ADMIN_ONLY`

### 404 — Not Found
- `NOT_FOUND`
- `WORKSPACE_NOT_FOUND`
- `DOCUMENT_NOT_FOUND`
- `TASK_NOT_FOUND`
- `FOLDER_NOT_FOUND`
- `INVITATION_NOT_FOUND`
- `MEMBER_NOT_FOUND`
- `TEMPLATE_NOT_FOUND`
- `FILE_NOT_FOUND`
- `EXPORT_JOB_NOT_FOUND`
- `LINK_NOT_FOUND`
- `TARGET_NOT_FOUND`

### 409 — Conflict
- `EMAIL_ALREADY_EXISTS`
- `ACCOUNT_EXISTS_LOCAL`
- `ACCOUNT_EXISTS_OAUTH`
- `ACCOUNT_EXISTS_OTHER_PROVIDER`
- `WORKSPACE_NAME_CONFLICT`
- `ALREADY_MEMBER`
- `ATTACHMENT_EXISTS`
- `CONCURRENT_MODIFICATION`
- `IDEMPOTENCY_CONFLICT`

### 429 — Rate Limiting
- `RATE_LIMITED`

### 400 — Workflow / State Errors
- `INVALID_TRANSITION`
- `INVALID_STATUS`
- `CANNOT_DEMOTE_OWNER`
- `CANNOT_REMOVE_OWNER`
- `CANNOT_LEAVE_AS_OWNER`
- `NO_SUPERVISOR_ASSIGNED`
- `DOCUMENT_EMPTY`
- `NOTE_REQUIRED`
- `FOLDER_NOT_EMPTY`
- `FILE_NOT_READY`
- `UPLOAD_NOT_FOUND_IN_STORAGE`
- `WORKSPACE_MISMATCH`
- `WORKSPACE_LIMIT_REACHED`
- `WORKSPACE_MEMBER_LIMIT_REACHED`
- `WORKSPACE_STORAGE_LIMIT_REACHED`
- `TASK_LIMIT_REACHED`
- `DOCUMENT_LIMIT_REACHED`
- `INVITATION_EXPIRED`
- `INVITATION_ALREADY_USED`
- `TOKEN_ALREADY_USED`
- `TOKEN_EXPIRED`

### 502/503 — External Dependency
- `SERVICE_UNAVAILABLE`
- `EMAIL_PROVIDER_UNAVAILABLE`
- `OAUTH_PROVIDER_UNAVAILABLE`
- `STORAGE_UNAVAILABLE`
- `COLLAB_SERVICE_UNAVAILABLE`

### 500 — Internal Errors
- `INTERNAL_ERROR`
- `DATABASE_ERROR`
- `TEMPLATE_APPLICATION_FAILED`
- `EXPORT_FAILED`

## Edge Cases / Failure Modes
- For non-member workspace access, return `403 NOT_WORKSPACE_MEMBER` consistently across all endpoints.
- Non-enumeration flows (auth resend/forgot) must not reveal account existence; still return 200 with generic message.
- Errors must never leak cross-workspace entity existence.

## Validation or Testing Notes
- Validate all endpoints emit only canonical error codes.
- Ensure error envelope always includes `requestId`.
- Confirm workspace isolation uses `403 NOT_WORKSPACE_MEMBER` consistently for authenticated non-members.
- Verify rate-limited responses include `Retry-After` and `RATE_LIMITED`.

## Related Files / Domains
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/api/*-endpoints.md`
- `docs/agent-ref/data/enums.md`


