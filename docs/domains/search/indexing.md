
# search/indexing

## Domain
Search indexing strategy for documents and tasks, including CRDT-derived plaintext rules and update cadence.

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — §4.10.7 Data Indexing Strategy (plaintext derivation)
- `docs/spec/08-data-model/08.5-documents-submissions.md` — documents plaintext + search_vector
- `docs/spec/08-data-model/08.6-tasks-columns-links.md` — tasks search_vector
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md` — onStoreDocument hook (persistence cadence)
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — workspace isolation rules
- `docs/spec/13-observability/13.4-metrics.md` — metrics expectations

## Included Topics
- What entities are indexed
- Plaintext derivation for CRDT documents
- Update triggers and cadence
- Index consistency guarantees
- Workspace isolation requirements
- Observability hooks

## Indexed entities (v1)
- **Documents**: `documents.title` + `documents.content_plaintext`
- **Tasks**: `tasks.title` + `tasks.description`
- **Comments**: optional v1.1+ (not required in v1)

## Plaintext derivation (MUST)
- Documents are stored as Yjs CRDT state (`documents.content_yjs`).
- Search must use a **derived plaintext** field:
  - `documents.content_plaintext` (TEXT)
- **Do NOT decode CRDT state on every search query**. Plaintext must be precomputed.

## Update cadence (MUST)
- Update `content_plaintext` and `search_vector` when:
  - Document metadata changes (title updates)
  - CRDT content is persisted (e.g., on collaboration `onStoreDocument`)
- Acceptable strategies:
  - Synchronous update in persistence hook (small docs)
  - Async worker/job that processes persisted Yjs updates and refreshes plaintext
- Plaintext may lag slightly; this is acceptable within a short window.

## FTS maintenance (MUST)
- Maintain `documents.search_vector` from:
  - `documents.title` (weight A)
  - `documents.content_plaintext` (weight B)
- Maintain `tasks.search_vector` from:
  - `tasks.title` (weight A)
  - `tasks.description` (weight B)
- Use triggers or application logic; either is acceptable as long as it is consistent.

## Isolation (MUST)
- All indexing and reindexing MUST preserve `workspace_id` scoping.
- Background jobs MUST NOT merge or leak content across workspaces.
- Derived plaintext and FTS indexes must be filtered by `workspace_id` at query time.

## Consistency guarantees
- **Eventual consistency** is acceptable:
  - Plaintext updates can lag the CRDT state briefly.
  - Search results may be slightly stale but must never leak unauthorized data.

## Edge cases (MUST)
- Large documents: prefer async plaintext derivation to avoid blocking collaboration persistence.
- Stale index detection: optional “last indexed” timestamp to surface lag.
- Deleted documents/tasks: ensure their search vectors are cleared or excluded from results.

## Observability (MUST)
- Track:
  - `search.index.update.count`
  - `search.index.update.latency_ms`
  - `search.index.stale.count` (if using staleness signals)
- Log indexing failures without including document content.