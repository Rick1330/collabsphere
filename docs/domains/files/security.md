## Domain
Files — Security

## Canonical Sources
- `docs/spec/11-security/11.9-file-security.md` — file access control, presigned URL guidance
- `docs/spec/05-features/05.7-files-attachments.md` — feature-level file security requirements
- `docs/spec/12-errors/12.1-error-taxonomy.md` — security-related error codes for files

## Included Topics
- Access control rules for file and attachment access
- Presigned URL lifetimes and scoping
- Allowed and disallowed MIME types and extensions
- Size limits and related security concerns
- Logging and auditing of sensitive file actions

## Workspace isolation (MUST)
- All file metadata and attachment queries MUST filter by `workspace_id`.
- Guessing file IDs or attachment IDs MUST NOT bypass authorization.
- Background processors (thumbnailers, antivirus scanners, preview generators) MUST operate within workspace isolation and MUST NOT leak artifacts across workspaces.

## Download access checks (MUST)
- Access MUST be rechecked at download time. Presigned URLs MUST be issued only after verifying current workspace membership and per-entity ACLs; cached authorizations MUST NOT be used without revalidation.
- Direct download endpoints MUST repeat the same authorization checks; upload-time checks are insufficient.

## Logging & privacy (MUST)
- Do NOT log presigned URL tokens or raw object keys. Log only opaque IDs and outcome codes.
- Emit audit events for sensitive file actions per canonical audit spec (access granted/denied, attachment added/removed), without including sensitive content.
