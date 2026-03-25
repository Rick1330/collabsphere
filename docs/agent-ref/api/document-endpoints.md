# Document Endpoints (agent-ref)

## Purpose
Provide a compact, execution-focused reference for document, folder, versioning, submission, and export REST endpoints, including auth/role requirements, constraints, and error codes.

## Canonical Sources
- `docs/domains/documents/api-contracts.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/documents/hierarchy.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/collab/overview.md`
- `docs/spec/05-features/05.4-documents.md`
- `docs/spec/04-user-flows/04.6-document-collaboration.md`
- `docs/spec/04-user-flows/04.11-academic-submission-review.md`
- `docs/spec/09-api-standards/09.3-response-standards.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/documents/api-contracts.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/documents/hierarchy.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/collab/overview.md`

## Scope
- Document/folder CRUD and hierarchy endpoints
- Lock/unlock endpoints
- Versions and restore
- Academic submission/review endpoints
- Export endpoints (async)
- REST metadata-only constraint (no CRDT content)

## Required Rules / Contract

### Base path
- `/api/v1/workspaces/:workspaceId`

### Hierarchy
- `GET /documents/tree`
- `POST /folders`
- `PATCH /folders/:folderId`
- `DELETE /folders/:folderId`

Rules:
- Max depth: 10
- Prevent cycles (`INVALID_PARENT`)
- Deleting non-empty folder is blocked (`FOLDER_NOT_EMPTY`)

### Documents
- `POST /documents` (Member+)
- `GET /documents/:documentId` (Viewer+; metadata only)
- `PATCH /documents/:documentId` (title/folder/position)
- `DELETE /documents/:documentId` (soft delete)

Rules:
- REST MUST NOT return editable CRDT/Yjs content.
- Edits blocked if workspace archived.
- Delete policy:
  - Disallow deletion when status is `submitted` or `approved` → `400 DOCUMENT_READONLY_STATUS`.
  - Permissions: Owner/Admin/Manager can delete; Member can delete own docs only; Viewer cannot delete.

### Locking
- `POST /documents/:documentId/lock` (Manager+)
- `POST /documents/:documentId/unlock` (Manager+)

Rules:
- Lock metadata recorded (`locked_by_user_id`, `locked_at`)
- Read-only enforced server-side in collab and REST where applicable.
- While locked, only the lock owner or Admin/Owner can edit; others read-only.

### Versions
- `GET /documents/:documentId/versions`
- `POST /documents/:documentId/versions/:versionId/restore` (Manager+)

Rules:
- Restore MUST create `before_restore` snapshot.
- No per-keystroke snapshots.

### Academic submission/review
- `POST /documents/:documentId/submit`
  - Errors: `DOCUMENT_EMPTY`, `INVALID_STATUS`, `FORBIDDEN`
- `POST /documents/:documentId/review`
  - Errors: `NOTE_REQUIRED`, `INVALID_STATUS`, `FORBIDDEN`
- `GET /documents/:documentId/submissions`

### Export
- `POST /documents/:documentId/export` → `202 Accepted` + `exportJobId`
- `GET /api/v1/exports/:exportJobId`

Rules:
- Async job required.
- Viewer export allowed only when workspace setting `workspace_settings.settings.allowViewerExport` is true.
- `EXPORT_JOB_NOT_FOUND` when missing.

### Required Errors (non-exhaustive)
- `NOT_WORKSPACE_MEMBER`
- `WORKSPACE_ARCHIVED_READONLY`
- `WORKSPACE_NOT_FOUND`
- `DOCUMENT_NOT_FOUND`
- `FOLDER_NOT_FOUND`
- `INVALID_PARENT`
- `FOLDER_NOT_EMPTY`
- `INVALID_STATUS`
- `DOCUMENT_EMPTY`
- `NOTE_REQUIRED`
- `DOCUMENT_READONLY_STATUS`
- `EXPORT_JOB_NOT_FOUND`

### Event Emissions (summary)
- Document lifecycle events must align with canonical catalog (`document.created`, `document.renamed`, `document.moved`, `document.locked`, `document.unlocked`, `document.submitted`, `document.reviewed`, `document.version_restored`, `document.export_requested`, `document.export_ready`).
- No per-keystroke activity or notifications.

## Edge Cases / Failure Modes
- Document delete is soft; submitted/approved documents cannot be deleted.
- Lock policy: only lock owner or Admin/Owner can edit while locked.
- Export requests should be idempotent or deduped within a short window.

## Validation or Testing Notes
- Validate workspace scoping and membership on all endpoints.
- Verify folder deletion fails when non-empty.
- Verify delete blocked for `submitted`/`approved` status with `DOCUMENT_READONLY_STATUS`.
- Confirm export flow: create job → poll → download URL.
- Ensure REST never returns CRDT content; collab service is required for editing.
- Confirm locked documents only allow edits by lock owner or Admin/Owner.

## Related Files / Domains
- `docs/agent-ref/collab/read-only-rules.md`
- `docs/agent-ref/collab/hocuspocus-hooks.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/events/domain-events.md`


