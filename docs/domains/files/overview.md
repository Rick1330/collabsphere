## Canonical Sources
- `docs/spec/05-features/05.7-files-attachments.md` — §5.7 Files & Attachments (overview, lifecycle, API, errors, observability)
- `docs/spec/11-security/11.9-file-security.md` — file security principles
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — workspace isolation requirements
- `docs/spec/12-errors/12.4-error-code-catalog.md` — file-related error codes
- `docs/spec/15-testing/15.6-required-test-suites.md` — files testing requirements

## Included Topics
- Conceptual model of files vs attachments
- High-level upload and download capabilities
- Relationship between raw storage objects and application-level records

## Files vs Attachments
- **Files** are the underlying storage objects.
- **Attachments** are the many-to-many relationship between files and entities (documents, tasks, comments).

## Constraints
- All file access MUST be workspace-isolated; IDs must not bypass authorization (IDOR prevention).
- Uploads MUST use a presigned URL strategy; clients must not choose bucket or object key directly.
- Presigned URL TTLs MUST be short (upload 5–15 minutes; download 1–5 minutes).
- Download access MUST be re-validated at access time (not only at upload/attach time).
- Content MUST be stored in S3-compatible storage (S3 in prod, MinIO in local).
- Files with `status != ready` MUST NOT be attachable or downloadable.
