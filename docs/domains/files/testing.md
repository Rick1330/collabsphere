# files/testing

## Domain
Files testing requirements (unit, integration, E2E, security, and observability).

## Canonical Sources
- `docs/spec/05-features/05.7-files-attachments.md` — §5.7.14 Testing Requirements; §5.7.12 Edge Cases
- `docs/spec/11-security/11.9-file-security.md` — file security requirements
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation test requirements
- `docs/spec/12-errors/12.4-error-code-catalog.md` — file-related error codes
- `docs/spec/13-observability/13.4-metrics.md` — metrics expectations
- `docs/spec/15-testing/15.6-required-test-suites.md` — file/upload test suites

## Included Topics
- Unit tests for validation and state transitions
- Integration tests for upload, complete, download, attach
- E2E tests for user workflows
- Security/isolation tests
- Observability tests

## Unit tests (required)
- MIME allowlist validation (`INVALID_FILE_TYPE`).
- Size limit validation (`FILE_TOO_LARGE`).
- Workspace storage limit validation (`WORKSPACE_STORAGE_LIMIT_REACHED`).
- Checksum validation (`CHECKSUM_MISMATCH`).
- Status gating for attach/download (`FILE_NOT_READY`).
- Workspace mismatch rejection (`WORKSPACE_MISMATCH`).
- Duplicate attachment rejection (`ATTACHMENT_EXISTS`).
- Pending upload timeout transition to `failed` (1 hour).

## Integration tests (required)
- Upload intent:
  - creates `files` row in `pending` state
  - returns presigned URL + expiry
- Complete upload:
  - transitions `pending|uploaded → ready`
  - is idempotent on repeat calls
  - fails with `UPLOAD_NOT_FOUND_IN_STORAGE` if object missing
- Download:
  - re-checks membership and ACLs at access time
  - fails if `status != ready`
- Attachments:
  - create attachment requires file `ready`
  - rejects cross-workspace target with `WORKSPACE_MISMATCH`
  - rejects duplicate file/target attach with `ATTACHMENT_EXISTS`
  - attachment visibility follows target permissions
- Delete:
  - soft delete prevents new download URLs
  - attachment handling follows policy (soft delete or mark missing)

## E2E (Playwright)
- Upload file → appears in files library → download works.
- Attach file to task → appears in task detail.
- Viewer cannot see upload/attach UI and API returns `403 FORBIDDEN`.
- Archived workspace blocks uploads/attachments but allows download.
- Upload intent issued but no upload → cleanup job removes after 1 hour (simulate clock).

## Security & isolation tests (required)
- Non-member cannot access file or attachment by guessed IDs (IDOR prevention).
- Presigned download URL issuance re-checks membership and workspace scope.
- Prevent joining/using another workspace’s file even if fileId is known.

## Observability tests (required)
- Metrics increment for:
  - `files.upload_intent.count`
  - `files.upload_complete.count`
  - `files.upload_fail.count`
  - `files.bytes_uploaded.total`
  - `files.download_url_issued.count`
  - `attachments.created.count`
- Logs:
  - `file_upload_intent_created`
  - `file_upload_complete`
  - `file_upload_complete_failed`
  - `file_download_denied`
  - `storage_presign_failed`
- Ensure logs do not contain presigned URLs or raw object keys.
