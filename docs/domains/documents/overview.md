# documents/overview

## Domain
Documents capability overview.

## Canonical Sources
- `docs/spec/05-features/05.4-documents.md` — §5.4 Documents
- `docs/spec/08-data-model/08.5-documents-submissions.md` — documents data model (Yjs/plaintext)
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md` — realtime collaboration rules
- `docs/spec/11-security/11.8-realtime-security.md` — realtime security enforcement
- `docs/spec/12-errors/12.4-error-code-catalog.md` — document workflow errors

## Included Topics
- Scope and priorities
- Permissions summary
- Key constraints (CRDT storage, content access via collab)

## Scope (v1)
- Hierarchical organization: folders + documents
- Real-time collaborative editing (via `collab/` domain)
- Comments and mentions (via `comments/` domain)
- Locking/unlocking (P1)
- Version history + restore (P1)
- Export to PDF/Markdown (P1)
- Academic submission/review statuses (academic workspaces)

## Permissions summary
Canonical matrix highlights:
- Viewer: view-only; cannot create/edit docs.
- Member+: create/edit docs.
- Manager+: lock/unlock; restore versions.
- Delete any doc: Owner/Admin/Manager; delete own: Member.

Overrides:
- Workspace archived: read-only for Member/Viewer/Manager.
- Academic statuses (`submitted`, `approved`) override edit rights for Members.

## Content storage
- Canonical content is Yjs state stored as `documents.content_yjs` (BYTEA).
- REST APIs return metadata; CRDT content is loaded via collaboration server WebSocket.
