# Export Schema (agent-ref)

## Purpose
Provide an execution-focused reference for export job persistence, constraints, retention, and access rules.

## Canonical Sources
- `docs/spec/08-data-model/08.11-exports-background-jobs.md`
- `docs/spec/05-features/05.4-documents.md` (export behavior)
- `docs/spec/05-features/05.7-files-attachments.md` (download security patterns)
- `docs/spec/12-errors/12.4-error-code-catalog.md`
- `docs/domains/documents/versioning-export.md`

## Domain Sources
- `docs/domains/documents/versioning-export.md`

## Scope
- `export_jobs` table schema and indexes
- Export job lifecycle states
- Access control for request and download
- Retention rules for jobs and outputs

## Required Rules / Contract

### Table: `export_jobs`
Purpose: Track export requests for user polling and download delivery.

Key fields (authoritative):
- `id` UUID PK
- `workspace_id` UUID FK → workspaces
- `requested_by` UUID FK → users
- `resource_type` varchar(40) (`document` in v1; `workspace` v1.1+)
- `resource_id` UUID
- `format` varchar(20) (`pdf|markdown`)
- `status` varchar(20): `queued|processing|ready|failed`
- `error_message` text nullable
- `output_file_id` UUID nullable (FK → files)
- `output_storage_key` varchar(500) nullable (if stored directly in S3)
- `created_at`, `updated_at`, `completed_at`, `deleted_at`

Indexes (canonical):
- `(requested_by, created_at DESC)` where `deleted_at IS NULL`
- `(workspace_id, created_at DESC)` where `deleted_at IS NULL`
- `(status, created_at DESC)` where `deleted_at IS NULL`

### Access control (MUST)
- Export requests must validate:
  - requester is active workspace member
  - requester has permission to export (Viewer export requires workspace setting)
- Download URL issuance must re-validate requester access (defense-in-depth).

### Retention
- Keep export jobs for **30 days** (configurable).
- Output files retained per file retention policy if stored as files.

## Edge Cases / Failure Modes
- Missing export job → `EXPORT_JOB_NOT_FOUND`.
- Workspace archived → export may be blocked (`WORKSPACE_ARCHIVED_READONLY`) if policy disallows.
- Concurrent export requests: recommended dedupe by idempotency key or short-window coalescing.

## Validation or Testing Notes
- Validate `format` enum and `resource_type`.
- Ensure access checks on both request and download.
- Verify retention cleanup job removes expired records without breaking access rules.

## Related Files / Domains
- `docs/agent-ref/api/document-endpoints.md`
- `docs/agent-ref/data/file-schema.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`


