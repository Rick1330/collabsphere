# files/data-model

## Domain
Files data model (files + attachments) and key constraints.

## Canonical Sources
- `docs/spec/05-features/05.7-files-attachments.md` — §5.7.6 data model
- `docs/spec/08-data-model/08.1-overview.md` — entity overview (file/blob/attachment)
- `docs/spec/11-security/11.9-file-security.md` — file security requirements
- `docs/spec/12-errors/12.4-error-code-catalog.md` — file-related error codes

## Included Topics
- `files` table schema and indexes
- `attachments` table schema and constraints
- Workspace scoping and access checks
- Lifecycle state constraints relevant to data model

## Table: `files` (authoritative)
Purpose: Store file metadata and lifecycle state; actual bytes live in object storage.

Key fields:
- `id` UUID PK
- `workspace_id` UUID FK → workspaces (MUST be set)
- `uploaded_by_user_id` UUID FK → users
- `status` enum: `pending|uploaded|ready|failed|deleted`
- `original_filename` varchar(255)
- `content_type` varchar(120)
- `size_bytes` bigint
- `storage_provider` enum (`s3` in v1)
- `storage_bucket` varchar(120)
- `storage_key` varchar(500)
- `checksum_sha256` char(64) optional
- `metadata` jsonb optional (image dimensions, PDF pages, etc.)
- `created_at`, `updated_at`, `deleted_at`

Indexes (recommended):
- `(workspace_id, created_at DESC)`
- `(workspace_id, status)`
- `(uploaded_by_user_id, created_at DESC)`

Rules (MUST):
- `workspace_id` is required for isolation; all queries filter by it.
- `status` governs attach/download eligibility: only `ready` can be attached or downloaded.
- `storage_key` must be unguessable and scoped to workspace.

## Table: `attachments` (authoritative)
Purpose: Link files to domain entities (documents, tasks; comments optional v1.1).

Key fields:
- `id` UUID PK
- `workspace_id` UUID FK → workspaces
- `file_id` UUID FK → files
- `target_type` enum: `document|task|comment` (comment optional v1.1)
- `target_id` UUID (polymorphic)
- `created_by_user_id` UUID FK → users
- `created_at`
- `deleted_at` nullable (soft delete)

Indexes (recommended):
- `(workspace_id, target_type, target_id)`
- `(workspace_id, file_id)`

Constraints (MUST):
- `file_id` and target entity MUST belong to the same `workspace_id` (enforced in service layer).
- Attaching a file with `status != ready` MUST be rejected (`FILE_NOT_READY`).
- Attachment visibility follows target permissions (workspace role + entity access).

## Lifecycle constraints
- `pending` records older than 1 hour must be marked `failed` and cleaned up.
- Soft-deleted files/attachments remain for retention and should not appear in normal queries.
- Downloads must re-check membership and ACLs at access time.

## Error code alignment
Common file/attachment errors:
- `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `WORKSPACE_STORAGE_LIMIT_REACHED`
- `FILE_NOT_READY`, `UPLOAD_NOT_FOUND_IN_STORAGE`, `CHECKSUM_MISMATCH`
- `FILE_NOT_FOUND`, `TARGET_NOT_FOUND`, `WORKSPACE_MISMATCH`, `ATTACHMENT_EXISTS`
