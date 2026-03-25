# File Schema (agent-ref)

## Purpose
Provide a compact, execution-focused reference for files and attachments persistence models, constraints, lifecycle rules, and access-control implications.

## Canonical Sources
- `docs/domains/files/data-model.md`
- `docs/domains/files/lifecycle.md`
- `docs/domains/files/security.md`
- `docs/spec/05-features/05.7-files-attachments.md`
- `docs/spec/11-security/11.9-file-security.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/files/data-model.md`
- `docs/domains/files/lifecycle.md`
- `docs/domains/files/security.md`

## Scope
- `files` and `attachments` tables
- Lifecycle state constraints and cleanup rules
- Workspace scoping and access-control requirements
- Attachment linking constraints

## Required Rules / Contract

### Table: `files`
Purpose: Store file metadata and lifecycle state; bytes live in object storage.

Key fields:
- `id` UUID PK
- `workspace_id` UUID FK → workspaces (required)
- `uploaded_by_user_id` UUID FK → users
- `status` enum: `pending|uploaded|ready|failed|deleted`
- `original_filename` varchar(255)
- `content_type` varchar(120)
- `size_bytes` bigint
- `storage_provider` enum (`s3` in v1)
- `storage_bucket` varchar(120)
- `storage_key` varchar(500) (unguessable; scoped to workspace)
- `checksum_sha256` char(64) optional
- `metadata` jsonb optional (image dimensions, PDF pages, etc.)
- `created_at`, `updated_at`, `deleted_at`

Indexes (recommended):
- `(workspace_id, created_at DESC)`
- `(workspace_id, status)`
- `(uploaded_by_user_id, created_at DESC)`

Constraints (MUST):
- `workspace_id` required for isolation; all queries filter by it.
- Only `ready` files can be attached or downloaded.
- `storage_key` must be unguessable and scoped to workspace.

### Table: `attachments`
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
- `file_id` and target entity MUST belong to the same `workspace_id`.
- Attaching a file with `status != ready` MUST be rejected (`FILE_NOT_READY`).
- Attachment visibility follows target permissions (workspace role + entity access).

### Lifecycle constraints
- `pending` records older than 1 hour must be marked `failed` and cleaned up.
- Soft-deleted files/attachments remain for retention and should not appear in normal queries.
- Download access must be re-checked at access time (membership + ACL).

## Edge Cases / Failure Modes
- Pending upload timeout: mark `failed` after 1 hour and cleanup.
- Client uploads but never calls complete: reconcile or delete in cleanup.
- File deleted while attached: attachment should be soft-deleted or shown as missing per policy.
- Workspace archived: block upload/attach; allow downloads with ACL checks.
- Storage outage: return `503 STORAGE_UNAVAILABLE`.

## Validation or Testing Notes
- Enforce MIME allowlist and size limits at upload intent.
- Verify idempotent completion returns `ready` on retries.
- Ensure workspace isolation on all file/attachment operations.
- Verify download URLs are short-lived and authorization is rechecked.

## Related Files / Domains
- `docs/agent-ref/api/file-endpoints.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/data/enums.md`


