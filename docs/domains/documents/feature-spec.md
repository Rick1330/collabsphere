# documents/feature-spec

## Domain
Documents feature spec (hierarchy, lifecycle, permissions).

## Canonical Sources
- `docs/spec/05-features/` — §5.4 Documents
- `docs/spec/02-personas-roles/` — document permission matrix
- `docs/spec/12-errors/` — doc/folder workflow errors

## Included Topics
- Hierarchy model and ordering
- Document statuses and editability logic
- Locking rules
- Versioning/export triggers
- Linking constraints and anchor degradation references

## Hierarchy model
- Folders can be nested up to 10 levels.
- Document belongs to folder or workspace root.
- Drag-and-drop reorder supported.
- Prevent cycles when moving folders.
- Ordering uses fractional `position` decimals.

## Effective edit permission
A document is editable iff:
- workspace not archived
- document not deleted
- document not locked (unless editor is lock owner or Admin/Owner)
- status not `submitted`/`approved` for Members (academic)

## Locking
- Lock toggled by Manager+.
- Locked docs show banner and enforce read-only for non-allowed roles.
- Lock metadata: `locked_by_user_id`, `locked_at`.

## Deletion
- Soft delete via `deleted_at`.
- Disallow deletion when status is `submitted` or `approved` (v1); return `DOCUMENT_READONLY_STATUS`.

## Status model
Always available:
- `draft`, `archived`
Academic when enabled:
- `submitted`, `changes_requested`, `approved`

## Versioning
- No per-keystroke snapshots.
- Snapshots created by manual action, periodic timers, and submission/review events.
- Restore must create `before_restore` snapshot.

## Export
- PDF/Markdown export via async job.
- Viewer export allowed only when workspace setting allows.

## Document ↔ Task linking (MUST)
- No cross-workspace linking: document and task MUST share the same `workspace_id`.
- Invalid anchors: navigation should degrade gracefully with banner; APIs requiring resolvable anchors return `INVALID_ANCHOR`.
- Deleted targets: if document deleted or task deleted, associated links follow retention policy and MUST not break workspace isolation. See `tasks/linking.md` for canonical rules and error codes.
