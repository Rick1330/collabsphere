# documents/user-flows

## Domain
Document-related end-to-end flows.

## Canonical Sources
- `docs/spec/04-user-flows/` — FL-005, FL-011, FL-012, FL-010
- `docs/spec/05-features/` — §5.4

## Included Topics
- Document create + open editor + collaboration
- Version history + restore
- Export
- Academic submission/review workflow

## FL-005 — Document creation + realtime collaboration
Document creation:
- `POST /api/v1/workspaces/:workspaceId/documents` (Member+)
- Seeds `content_yjs` from blank or template
- Logs activity event `document.created`

Open editor:
- `GET /api/v1/workspaces/:workspaceId/documents/:documentId` returns metadata + permissions.
- Collaboration session is established via `collab/` domain (Hocuspocus room `doc:<documentId>`).

Edge cases:
- Viewer opens doc: read-only.
- Locked/submitted/approved: read-only for Members; enforcement required on server.
- Permission change mid-session: server rejects writes; client shows banner.

## FL-011 — Version history + restore
- Versions created by time/event triggers (manual, auto, submission, before_restore).
- Restore is Manager+ and must create `before_restore` snapshot first.

## FL-012 — Export (PDF/Markdown)
- `POST /api/v1/workspaces/:workspaceId/documents/:documentId/export` enqueues async job.
- Client polls `GET /api/v1/exports/:exportJobId`.
- Download via signed URL when ready.

## FL-010 — Academic submission/review
- Submit: `POST /api/v1/workspaces/:workspaceId/documents/:documentId/submit` (Member+)
  - validates document not empty
  - sets status `submitted`
  - creates submission record pointing to snapshot version
  - locks student edits
- Review: `POST /api/v1/workspaces/:workspaceId/documents/:documentId/review` (Owner/Supervisor)
  - decision: `approved` or `changes_requested`
  - `changes_requested` requires note/feedback
  - unlocks editing when changes requested

See `documents/versioning-export.md` and `documents/feature-spec.md` for constraints.
