# documents/hierarchy

## Domain
Folders + documents hierarchy, ordering, and move/delete constraints.

## Canonical Sources
- `docs/spec/05-features/05.4-documents.md` — §5.4.4 Document Hierarchy Model; §5.4.12 API Contracts
- `docs/spec/08-data-model/08.5-documents-submissions.md` — folders/documents schema and ordering
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `INVALID_PARENT`, `FOLDER_NOT_EMPTY`, `FOLDER_NOT_FOUND`, `DOCUMENT_NOT_FOUND`

## Included Topics
- Data model constraints (parent relationships)
- Cycle prevention
- Ordering strategy (`position` decimal)
- Deletion rules
- Tree endpoint contract summary

## Hierarchy rules (MUST)
- Max nesting depth: **10 levels**.
- Documents are leaf nodes; folders are containers.
- A document belongs either to a folder or the workspace root.
- Titles should be unique **within the same folder** (recommended in canonical spec).

## Moves (MUST)
Allowed moves:
- Reorder within the same parent (folder or root)
- Move document across folders
- Move folder across folders

## Cycle prevention (MUST)
- A folder cannot be moved under itself or any descendant.
- Violations return `400 INVALID_PARENT`.

## Ordering (MUST)
- Use fractional ordering decimals for both folders and documents.
- When inserting between adjacent items, choose midpoint (e.g., 1.0 and 2.0 → 1.5).
- Optional P3: rebalance job to normalize positions.

## Deletion rules (v1)
- Deleting a non-empty folder is **blocked** in v1.
- API must return `400 FOLDER_NOT_EMPTY` if folder contains any child documents/folders.

## Tree endpoint
`GET /api/v1/workspaces/:workspaceId/documents/tree` returns nested tree nodes with:
- `type: folder|document`
- id, name/title, parent ids
- position
- status/lock metadata for documents

## Error codes (canonical)
- `INVALID_PARENT`
- `FOLDER_NOT_EMPTY`
- `FOLDER_NOT_FOUND`
- `DOCUMENT_NOT_FOUND`
