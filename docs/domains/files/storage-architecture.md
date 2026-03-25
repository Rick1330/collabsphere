## Canonical Sources
- `docs/spec/05-features/05.7-files-attachments.md` — §5.7.4 Storage Architecture
- `docs/spec/07-architecture/07.2-tech-stack.md` — S3-compatible storage

## Included Topics
- Storage backend(s) used (e.g., object storage) as described in the spec
- Bucket/container organization and naming strategy
- Path and key design for stored objects

## Storage Strategy
- Production MUST use **AWS S3** or an S3-compatible provider.
- Local development MUST use **MinIO**.

## Keying Strategy (MUST)
- Storage keys MUST be unguessable and scoped by workspace:
  - `workspaces/<workspaceId>/files/<fileId>/<sanitizedFilename>`
- Clients MUST NOT be allowed to choose bucket or storage key directly.
- Pre-signed URL TTL MUST be short (5–15 minutes).
