# Document Schema (agent-ref)

## Purpose
Provide an execution-focused reference for document-related persistence schemas, constraints, indexes, lifecycle rules, and retention requirements.

## Canonical Sources
- `docs/domains/documents/data-model.md`
- `docs/domains/documents/hierarchy.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/collab/persistence.md`
- `docs/spec/08-data-model/08.5-documents-submissions.md`
- `docs/spec/05-features/05.4-documents.md`
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/documents/data-model.md`
- `docs/domains/documents/hierarchy.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/collab/persistence.md`

## Scope
- `folders`, `documents`, `document_versions`, `document_submissions`
- CRDT storage fields and derived plaintext
- Hierarchy constraints, ordering, and indexes
- Version snapshot rules and restore invariants
- Export job references (see `export-schema.md`)

## Required Rules / Contract

### folders
- Workspace-scoped; includes `workspace_id`.
- Parent self-FK (nullable for root).
- `position` decimal ordering for display.
- Soft delete via `deleted_at`.

Constraints:
- Max nesting depth: 10.
- Prevent cycles (cannot move a folder under itself/descendant).
- Deleting non-empty folder MUST be blocked (`FOLDER_NOT_EMPTY`).

### documents
Key fields:
- `workspace_id` (required, workspace-scoped).
- `folder_id` nullable (root allowed).
- `status`: `draft|submitted|changes_requested|approved|archived`.
- Lock fields: `is_locked`, `locked_by_user_id`, `locked_at`.
- Canonical content: `content_yjs` BYTEA.
- Derived fields: `content_plaintext` TEXT, `search_vector` TSVECTOR.
- Ordering: `position` decimal.

Constraints:
- REST MUST NOT return editable CRDT/Yjs content.
- `search_vector` must be updated when title or `content_plaintext` changes.
- Archived workspace blocks document writes.
- Submitted/approved enforce read-only for Members.
- Locked documents are editable only by lock owner or Admin/Owner; all others read-only.
- Document delete is soft; deletion is disallowed when status is `submitted` or `approved` (`DOCUMENT_READONLY_STATUS`).

Indexes (canonical/recommended):
- `(workspace_id, updated_at DESC)`
- `(workspace_id, folder_id, position)`
- GIN on `search_vector`

### document_versions
- Immutable snapshots.
- Unique `(document_id, version_number)`.
- Stores `yjs_state` BYTEA; optional plaintext.
- `reason` enum: `manual|auto|submitted|approved|before_restore`.

Rules:
- No per-keystroke snapshots.
- Restore MUST create `before_restore` snapshot before applying.

### document_submissions (academic)
- Tracks submission cycles.
- References `snapshot_version_id`.
- Decision fields: `approved|changes_requested` + note.

## Edge Cases / Failure Modes
- Folder move that creates a cycle must return `INVALID_PARENT`.
- Deleting a folder with children must return `FOLDER_NOT_EMPTY`.
- Document edits when workspace archived must return `WORKSPACE_ARCHIVED_READONLY`.
- Export and version restore must handle concurrent editor sessions (clients reload or show banner).

## Validation or Testing Notes
- Enforce `workspace_id` scoping on all document tables and joins.
- Verify `content_plaintext` updates on persistence hook or async worker.
- Validate max depth and cycle prevention on folder moves.
- Confirm `before_restore` snapshot on restore.

## Related Files / Domains
- `docs/agent-ref/data/export-schema.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/collab/yjs-state-model.md`
- `docs/agent-ref/collab/hocuspocus-hooks.md`


