# File Endpoints (agent-ref)

## Purpose
Execution-focused REST endpoint contracts for file uploads, downloads, attachments, and related constraints.

## Canonical Sources
- `docs/domains/files/api-contracts.md`
- `docs/domains/files/data-model.md`
- `docs/domains/files/lifecycle.md`
- `docs/domains/files/security.md`
- `docs/spec/05-features/05.7-files-attachments.md`
- `docs/spec/09-api-standards/09.3-response-standards.md`
- `docs/spec/09-api-standards/09.4-error-standards.md`
- `docs/spec/09-api-standards/09.5-pagination.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/files/api-contracts.md`
- `docs/domains/files/data-model.md`
- `docs/domains/files/lifecycle.md`
- `docs/domains/files/security.md`

## Scope
- Presigned upload intent + completion
- File listing and download URL issuance
- File deletion (soft delete)
- Attachments create/list
- Auth/role requirements, invariants, and error codes

## Required Rules / Contract

### Base
- Base path: `/api/v1/workspaces/:workspaceId`
- Auth required (JWT).
- All queries MUST filter by `workspace_id`.
- Viewer role is read-only: upload/attach returns `403 FORBIDDEN`.
- Workspace archived: uploads/attach blocked; downloads allowed with ACL checks.

### Endpoints

#### 1) Create upload intent (presigned URL)
`POST /files/upload-intent`

Request:
- `originalFilename`, `contentType`, `sizeBytes`, optional `checksumSha256`.

Response:
- `file` in `pending` state
- `upload` method/URL/headers with short expiry

Errors:
- `400 INVALID_FILE_TYPE`
- `400 FILE_TOO_LARGE`
- `400 WORKSPACE_STORAGE_LIMIT_REACHED`
- `403 FORBIDDEN`
- `404 WORKSPACE_NOT_FOUND`

Rules:
- MIME allowlist enforced server-side.
- Storage key unguessable and scoped to workspace.
- Presigned URL expires in 5–15 minutes.

#### 2) Confirm upload completion
`POST /files/:fileId/complete`

Request:
- optional `checksumSha256`

Response:
- `file.status = ready` + `downloadUrl` (short-lived)

Errors:
- `400 UPLOAD_NOT_FOUND_IN_STORAGE`
- `400 CHECKSUM_MISMATCH`
- `400 FILE_NOT_READY` (if invalid state)
- `403 FORBIDDEN`
- `404 FILE_NOT_FOUND`

Rules:
- Idempotent: repeated calls return ready.

#### 3) List files
`GET /files`

Query params:
- `page`, `pageSize`
- `type=image/png,application/pdf` (optional)
- `uploadedBy=<uuid>` (optional)
- `search=<string>` (optional)

Errors:
- `403 NOT_WORKSPACE_MEMBER`
- `404 WORKSPACE_NOT_FOUND`

#### 4) Download file (signed URL)
`GET /files/:fileId/download`

Response:
- `downloadUrl` + `expiresAt`

Errors:
- `403 FORBIDDEN`
- `404 FILE_NOT_FOUND`
- `400 FILE_NOT_READY`

Rules:
- Re-check membership + ACL at download time.
- TTL 1–5 minutes.
- Always set safe download headers (`Content-Disposition`, `X-Content-Type-Options: nosniff`).

#### 5) Delete file (soft delete)
`DELETE /files/:fileId`

Roles:
- Manager+ can delete any file
- Member can delete own uploaded files

Errors:
- `403 FORBIDDEN`
- `404 FILE_NOT_FOUND`

Rules:
- Soft delete file.
- Attachments referencing deleted file should be soft-deleted or marked missing.

#### 6) Attach file to target
`POST /attachments`

Request:
- `fileId`, `targetType=document|task`, `targetId`

Errors:
- `400 FILE_NOT_READY`
- `404 FILE_NOT_FOUND`
- `404 TARGET_NOT_FOUND`
- `403 FORBIDDEN`
- `400 WORKSPACE_MISMATCH`
- `409 ATTACHMENT_EXISTS`

Rules:
- `file.workspace_id` must match target workspace.
- Only `ready` files can be attached.

#### 7) List attachments for target
`GET /attachments?targetType=task&targetId=...`

Errors:
- `403 NOT_WORKSPACE_MEMBER`
- `404 TARGET_NOT_FOUND`

## Edge Cases / Failure Modes
- Pending uploads older than 1 hour → mark `failed` and cleanup.
- Client uploads but never calls complete → cleanup reconciles storage/object state.
- Workspace archived → block upload/attach; downloads still require ACL checks.
- Storage outage → return `503 STORAGE_UNAVAILABLE`.

## Validation or Testing Notes
- Enforce MIME allowlist and size limits.
- Ensure idempotent complete returns ready on retries.
- Verify workspace isolation on all file/attachment reads and writes.
- Confirm download URLs are short-lived and scoped.

## Related Files / Domains
- `docs/agent-ref/data/file-schema.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/events/domain-events.md`


