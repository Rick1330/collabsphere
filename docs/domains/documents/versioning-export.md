# documents/versioning-export

## Domain
Document version snapshots, restore, and export workflows.

## Canonical Sources
- `docs/spec/05-features/05.4-documents.md` — §5.4.9 version history; §5.4.10 export
- `docs/spec/08-data-model/08.5-documents-submissions.md` — document_versions + submissions snapshot reference
- `docs/spec/08-data-model/08.11-exports-background-jobs.md` — export_jobs model
- `docs/spec/12-errors/12.4-error-code-catalog.md` — export and workflow errors

## Included Topics
- Snapshot triggers and stored fields
- Restore rules and side effects
- Export job lifecycle and API

## Versioning (snapshots)
Canonical approach:
- Create snapshots on:
  1) manual action (P1)
  2) academic submission (required)
  3) periodic trigger (every **10 minutes** while editing) **or** on editor disconnect (best effort)

Stored per version:
- document/workspace IDs
- incrementing version number
- reason enum: `manual|auto|submitted|approved|before_restore`
- `yjs_state` (BYTEA snapshot)
- optional plaintext for diff/search

No per-keystroke versions.

## Restore
- Role: Manager+
- Must create `before_restore` snapshot first.
- Replace `documents.content_yjs` with snapshot.
- Emit events + activity and notify clients via realtime metadata event.

Edge case:
- Restoring while others edit: broadcast restoration; clients reload state or show banner.

## Export
Formats:
- PDF
- Markdown

Execution model:
- async job via queue (BullMQ)
- persist an export job record for client polling

Download:
- short-lived signed URL recommended

Permissions:
- Viewer export allowed only if workspace setting enables it.

Errors (non-exhaustive, see catalog):
- `403 WORKSPACE_ARCHIVED_READONLY`
- `404 DOCUMENT_NOT_FOUND`
- `404 EXPORT_JOB_NOT_FOUND`
- `400 INVALID_STATUS` (if export disallowed by policy)

Deduping:
- recommended: dedupe repeated export requests within a short window (e.g., 60s) or via idempotency key.
