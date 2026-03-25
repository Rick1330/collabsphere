# documents/api-contracts

## Domain
Documents/folders/version/export REST API contracts.

## Canonical Sources
- `docs/spec/05-features/05.4-documents.md` — §5.4.12 API contracts
- `docs/spec/04-user-flows/04.6-document-collaboration.md` — FL-005 document creation + collab
- `docs/spec/04-user-flows/04.11-academic-submission-review.md` — academic submit/review flows
- `docs/spec/04-user-flows/04.1-flow-catalog.md` — export flow references
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes/errors
- `docs/spec/12-errors/12.4-error-code-catalog.md` — document workflow/error codes

## Included Topics
- Document tree and hierarchy endpoints
- Document metadata endpoints
- Lock/unlock endpoints
- Version list/restore endpoints
- Academic submit/review endpoints
- Export endpoints

## Hierarchy
- `GET /api/v1/workspaces/:workspaceId/documents/tree`
- `POST /api/v1/workspaces/:workspaceId/folders`
- `PATCH /api/v1/workspaces/:workspaceId/folders/:folderId`
- `DELETE /api/v1/workspaces/:workspaceId/folders/:folderId` → may return `400 FOLDER_NOT_EMPTY`

## Documents
- `POST /api/v1/workspaces/:workspaceId/documents` (Member+)
- `GET /api/v1/workspaces/:workspaceId/documents/:documentId` (Viewer+; metadata only)
- `PATCH /api/v1/workspaces/:workspaceId/documents/:documentId` (title/folder/position)
- `DELETE /api/v1/workspaces/:workspaceId/documents/:documentId` (Owner/Admin/Manager; Member own only; disallow submitted/approved)

## Locking
- `POST /api/v1/workspaces/:workspaceId/documents/:documentId/lock`
- `POST /api/v1/workspaces/:workspaceId/documents/:documentId/unlock`

## Versions
- `GET /api/v1/workspaces/:workspaceId/documents/:documentId/versions`
- `POST /api/v1/workspaces/:workspaceId/documents/:documentId/versions/:versionId/restore` (Manager+)

## Academic submission/review
- `POST /api/v1/workspaces/:workspaceId/documents/:documentId/submit`
  - errors: `400 DOCUMENT_EMPTY`, `400 INVALID_STATUS`, `403 FORBIDDEN`
- `POST /api/v1/workspaces/:workspaceId/documents/:documentId/review`
  - errors: `400 NOTE_REQUIRED`, `400 INVALID_STATUS`, `403 FORBIDDEN`
- `GET /api/v1/workspaces/:workspaceId/documents/:documentId/submissions`

## Export
- `POST /api/v1/workspaces/:workspaceId/documents/:documentId/export` → `202 Accepted` with `exportJobId`
- `GET /api/v1/exports/:exportJobId` → ready download URL

## Notes
- Document CRDT content is not returned by REST in v1; it is loaded via collaboration WebSocket.
- Common document errors (non-exhaustive, see error catalog):
  - `403 NOT_WORKSPACE_MEMBER`, `403 WORKSPACE_ARCHIVED_READONLY`
  - `404 DOCUMENT_NOT_FOUND`, `404 FOLDER_NOT_FOUND`, `404 WORKSPACE_NOT_FOUND`
  - `400 INVALID_PARENT`, `400 FOLDER_NOT_EMPTY`
  - `400 INVALID_STATUS`, `400 DOCUMENT_READONLY_STATUS`, `400 DOCUMENT_EMPTY`, `400 NOTE_REQUIRED`
- Export is asynchronous and should return `202 Accepted` with `exportJobId`; polling uses `GET /api/v1/exports/:exportJobId` and returns `404 EXPORT_JOB_NOT_FOUND` if missing.
