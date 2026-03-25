# documents/data-model

## Domain
Documents persistence model (folders, docs, versions, submissions).

## Canonical Sources
- `docs/spec/08-data-model/` — folders/documents/document_versions/document_submissions tables
- `docs/spec/05-features/` — §5.4 data model

## Included Topics
- Table schemas and key constraints
- CRDT storage fields and derived plaintext/search
- Academic submission records

## folders
- workspace-scoped
- parent self-FK
- `position` decimal ordering
- soft delete via `deleted_at`

## documents
- workspace-scoped
- `folder_id` nullable
- `status`: draft/submitted/changes_requested/approved/archived
- lock fields: `is_locked`, `locked_by_user_id`, `locked_at`
- canonical content: `content_yjs` BYTEA
- derived: `content_plaintext` TEXT + `search_vector` TSVECTOR
- ordering: `position` decimal

Maintaining `search_vector`:
- update when title/plaintext changes (trigger or app logic)

## document_versions
- immutable snapshots
- unique `(document_id, version_number)`
- stores `yjs_state` BYTEA and optional plaintext
- reason enum includes `before_restore`

## document_submissions (academic)
- records each submission cycle
- points to `snapshot_version_id`
- decision fields: approved|changes_requested + note
