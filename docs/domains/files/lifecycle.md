## Domain
Files — Lifecycle

## Canonical Sources
- `docs/spec/05-features/05.7-files-attachments.md` — file lifecycle requirements
- `docs/spec/08-data-model/08.1-entities.md` — lifecycle state fields and timestamps
- `docs/spec/11-security/11.9-file-security.md` — retention and deletion policies

## Included Topics
- States and transitions (uploading, ready, soft-deleted, hard-deleted)
- Handling of failed and abandoned uploads
- Retention and cleanup policies
- Impact of workspace or document deletion on files and attachments
- Lifecycle-specific error codes and access checks

## State machine (MUST)
States:
- `pending` (upload intent issued; no object verified)
- `uploaded` (client reported completion; awaiting verification)
- `ready` (verified; eligible for download/attach)
- `failed` (timeout/verification failure)
- `deleted` (soft-deleted)

Transitions:
- `pending` → `uploaded` → `ready`
- `pending` → `failed` (timeout)
- `uploaded` → `failed` (verification mismatch)
- any state → `deleted` (soft) → expunge per retention → hard-delete in storage and DB

## Timeouts & cleanup (MUST)
- Pending upload timeout: uploads that do not complete within **1 hour** MUST be marked `failed` and cleaned up (temporary objects removed) per spec §5.7.5 and §5.7.12.
- Client uploads but never calls complete: storage object may exist; record remains `pending` until cleanup job reconciles or deletes (spec §5.7.12).
- Orphaned uploads: records without attachment/owner beyond retention window MUST be cleaned up by background job.

## Attachments and deletion (MUST)
- If a file’s parent document/task/comment is deleted, attachment links MUST be removed/soft-deleted; file retention follows canonical policy (may keep if referenced elsewhere).
- Workspace deletion/archival applies access restrictions and cleanup consistent with spec; downloads MUST continue to re-check permissions until final expunge.

## Error codes (canonical)
- `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `WORKSPACE_STORAGE_LIMIT_REACHED`
- `FILE_NOT_READY`, `UPLOAD_NOT_FOUND_IN_STORAGE`, `CHECKSUM_MISMATCH`
- `FILE_NOT_FOUND`

## Access checks (MUST)
- Download access MUST be revalidated at access time; upload-time checks alone are insufficient.
