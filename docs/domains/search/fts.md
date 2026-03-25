# search/fts

## Domain
Search — PostgreSQL Full-Text Search (FTS).

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — §4.10.8 PostgreSQL FTS DDL and query strategy
- `docs/spec/08-data-model/08.5-documents-submissions.md` — documents `search_vector` storage
- `docs/spec/08-data-model/08.6-tasks-columns-links.md` — tasks `search_vector` storage
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — workspace isolation requirements
- `docs/spec/06-nfrs/06.2-performance.md` — search latency targets

## Included Topics
- FTS schema and indexes (documents + tasks)
- Query strategy and tsquery choices
- Weighting strategy and ranking
- Workspace isolation requirements

## FTS Schema (Authoritative)

### Documents
```docs/domains/search/fts.md#L20-52
ALTER TABLE documents
ADD COLUMN search_vector tsvector;

UPDATE documents
SET search_vector =
  setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(content_plaintext,'')), 'B');

CREATE INDEX idx_documents_search_vector
ON documents
USING GIN (search_vector);
```

### Tasks
```docs/domains/search/fts.md#L54-86
ALTER TABLE tasks
ADD COLUMN search_vector tsvector;

UPDATE tasks
SET search_vector =
  setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(description,'')), 'B');

CREATE INDEX idx_tasks_search_vector
ON tasks
USING GIN (search_vector);
```

## Query Strategy (Canonical)
- Use `websearch_to_tsquery` (preferred) for user-friendly syntax (quoted phrases, etc.).
- `plainto_tsquery` is acceptable for basic keyword search.
- Apply weights as shown above; title is weighted higher than body/description.

## Workspace Isolation (MUST)
- All queries MUST include `workspace_id` filtering.
- Global search MUST join against `workspace_members` to limit to user’s workspaces.
- Admin global search MUST still enforce per-entity ACLs and is only available under admin routes.

## Ranking Rules (Summary)
- Documents:
  - Title matches weighted highest (A).
  - Content plaintext weighted medium (B).
  - Recency boost optional (P2).
- Tasks:
  - Title weighted highest (A).
  - Description weighted medium (B).

## Notes
- `search_vector` updates must be kept consistent with `content_plaintext` and titles.
- CRDT/Yjs content must not be decoded on-demand for each search query; use derived plaintext.
