# files/feature-spec

## Domain
Files feature specification: upload, download, attach, limits, error handling, and edge cases.

## Canonical Sources
- `docs/spec/05-features/05.7-files-attachments.md` — §5.7 Files & Attachments
- `docs/spec/12-errors/12.4-error-code-catalog.md` — file-related error codes
- `docs/spec/11-security/11.9-file-security.md` — file security requirements
- `docs/spec/06-nfrs/06.5-security.md` — security baseline (limits, isolation)
- `docs/spec/08-data-model/08.1-overview.md` — file/attachment tables

## Included Topics
- Supported file types and size limits
- Storage and upload/download constraints
- Attachment rules
- Error codes
- Cleanup expectations

## Supported file types (v1 defaults)
### Allowed MIME types (allowlist)
**Documents**
- `application/pdf`
- `text/plain`
- `text/markdown`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX, optional)
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` (PPTX, optional)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX, optional)

**Images**
- `image/png`
- `image/jpeg`
- `image/webp` (optional)

**Archives (optional, risky)**
- `application/zip` (only if scanning exists)

**Code/Config (optional)**
- `application/json`
- `text/csv`

**Disallowed in v1**
- Executable and script types (e.g., `.exe`, `.dll`, `.sh`, `.bat`).

## Size and storage limits (v1 defaults)
- Max single file size: **25 MB**
- Max total workspace storage: **5 GB** (configurable)
- Max files per workspace: **10,000** (configurable)

## Upload and download constraints (MUST)
- Uploads MUST use presigned URLs; clients MUST NOT upload via API file streaming in v1.
- Upload intent MUST validate MIME type and size against allowlist and limits.
- Download must re-check membership and workspace scoping at access time.
- Presigned URL TTL MUST be short (upload 5–15 min; download 1–5 min).

## Attachment rules (MUST)
- Files can be attached to documents and tasks in v1 (comments optional v1.1).
- File and target entity MUST belong to the same workspace; else reject.
- Files with `status != ready` MUST NOT be attachable.

## Error codes (canonical)
Use these exact codes from the error catalog:

**Validation/limits (400)**
- `INVALID_FILE_TYPE` — file MIME type not allowlisted
- `FILE_TOO_LARGE` — file exceeds max size
- `WORKSPACE_STORAGE_LIMIT_REACHED` — workspace storage cap exceeded
- `CHECKSUM_MISMATCH` — upload integrity failed
- `FILE_NOT_READY` — file not ready for attach/download
- `UPLOAD_NOT_FOUND_IN_STORAGE` — complete called but object missing

**Not found (404)**
- `FILE_NOT_FOUND`
- `TARGET_NOT_FOUND`

**Authorization (403)**
- `FORBIDDEN` (e.g., Viewer upload/attach)
- `WORKSPACE_ARCHIVED_READONLY`

**State/workflow**
- `WORKSPACE_MISMATCH` (file/target workspace mismatch)
- `ATTACHMENT_EXISTS` (duplicate file/target attach)

## Cleanup expectations (MUST)
- Abandoned uploads and orphaned files MUST be cleaned by scheduled jobs within canonical retention windows.
- Pending uploads expire after **1 hour** and transition to failed; cleanup removes objects.
- Deleting a file should cascade or soft-delete attachments (per policy) while preserving isolation.

## Noise control (MUST)
- Do NOT generate notifications on every file upload.
- Only notify when context warrants it (e.g., attachment to task in P2 policy).

## Security and privacy (MUST)
- Enforce workspace isolation on every file and attachment action.
- Never log presigned URLs, raw object keys, or sensitive file contents.
