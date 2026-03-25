# CS-143 -> P03 Handoff: Search FTS Schema & Indexing

## Purpose
- Provide P03 with schema and migration requirements for search_vector columns, GIN indexes, update logic, and backfill for CS-143.
- Ensure search indexing follows derived plaintext rules and workspace isolation requirements.

## Scope Boundary (P14 vs P03)
- P14 provides requirements only in this handoff; no Prisma schema or migration edits in Project 14.
- P03 owns Prisma schema, migrations, and database implementation for FTS columns, indexes, triggers, and backfill.
- P03 ensures search_vector updates align with derived plaintext rules and workspace isolation requirements.

## Documents search_vector column
- Add `documents.search_vector` as `tsvector`.
- `documents.search_vector` is derived from `documents.title` and `documents.content_plaintext`.
- `documents.search_vector` must be updated when title or content_plaintext changes.

## Tasks search_vector column
- Add `tasks.search_vector` as `tsvector`.
- `tasks.search_vector` is derived from `tasks.title` and `tasks.description`.
- `tasks.search_vector` must be updated when title or description changes.

## Trigger logic (documents)
- Maintain `documents.search_vector` using `setweight(to_tsvector('english', ...), 'A')` for title and weight 'B' for content_plaintext.
- Update search_vector when title changes and when content_plaintext is persisted (onStoreDocument or async job).
- Do not decode CRDT/Yjs content at query time; use derived content_plaintext.

## Trigger logic (tasks)
- Maintain `tasks.search_vector` using `setweight(to_tsvector('english', ...), 'A')` for title and weight 'B' for description.
- Update search_vector when title or description changes.

## GIN index requirements
- Create `idx_documents_search_vector` using `GIN (search_vector)` on `documents`.
- Create `idx_tasks_search_vector` using `GIN (search_vector)` on `tasks`.
- Document and task schemas require GIN indexes on search_vector.

## Backfill requirements
- Backfill `documents.search_vector` with `setweight(to_tsvector('english', coalesce(title,'')), 'A') || setweight(to_tsvector('english', coalesce(content_plaintext,'')), 'B')`.
- Backfill `tasks.search_vector` with `setweight(to_tsvector('english', coalesce(title,'')), 'A') || setweight(to_tsvector('english', coalesce(description,'')), 'B')`.
- Large-table backfills should avoid long locks; async or batched approaches are acceptable.
- Eventual consistency is acceptable; search results may lag briefly but must not leak unauthorized data.

## Sequencing and dependencies
- Use derived plaintext (`documents.content_plaintext`); do not decode CRDT/Yjs on search queries.
- Sequence per CS-143 tasks: add search_vector columns, implement update logic, add GIN indexes, then backfill.

## Acceptance criteria
- `documents.search_vector` and `tasks.search_vector` exist as `tsvector` columns.
- `documents.search_vector` uses title weight A and content_plaintext weight B with `to_tsvector('english', ...)`.
- `tasks.search_vector` uses title weight A and description weight B with `to_tsvector('english', ...)`.
- search_vector updates when source fields change (documents.title/content_plaintext; tasks.title/description).
- `idx_documents_search_vector` and `idx_tasks_search_vector` exist as GIN indexes.
- Backfill populates search_vector for existing rows using the canonical setweight/to_tsvector logic.
- CRDT content is not decoded on each search query; derived content_plaintext is used.

## References
- `docs/domains/search/fts.md`
- `docs/domains/search/indexing.md`
- `docs/spec/04-user-flows/04.10-search.md`
- `docs/spec/08-data-model/08.5-documents-submissions.md`
- `docs/spec/08-data-model/08.6-tasks-columns-links.md`
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md`
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/data/task-schema.md`
