# search/README

## Domain
Search & discovery across CollabSphere entities (documents, tasks, comments, workspaces, etc.), including indexing, PostgreSQL full-text search (FTS), ranking, and search APIs.

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — FL-009 search journeys and modes
- `docs/spec/05-features/05.4-documents.md` — document search fields (plaintext)
- `docs/spec/08-data-model/08.5-documents-submissions.md` — document FTS index
- `docs/spec/08-data-model/08.6-tasks-columns-links.md` — task FTS index
- `docs/spec/06-nfrs/06.2-performance.md` — search latency requirements
- `docs/spec/13-observability/13.3-structured-logging.md` — search logging constraints
- `docs/spec/13-observability/13.4-metrics.md` — search metrics requirements

## Included Topics
- End-user search flows and supported filters
- Indexing pipeline, including how CRDT-backed documents are transformed to searchable text
- PostgreSQL FTS strategy (DDL, queries, ranking)
- Search API contracts (requests, responses, pagination, errors)
- Observability for search performance and failures
- Privacy and security constraints for logging/search isolation

## Related domains
- `documents/` — document content and metadata that feed indexing
- `tasks/` — task records surfaced in search
- `comments/` — comment content indexing rules
- `collab/` — CRDT/Yjs representation to plaintext for indexing
- `quality/` — NFRs and observability related to search performance and relevance

## Workspace isolation (MUST)
- All search queries MUST be constrained by `workspace_id` of the active context.
- Admin/global search endpoints (per spec) MUST still enforce per-entity ACLs and never leak cross-workspace entities in results.
- Background indexing and derived fields (e.g., `content_plaintext`) MUST preserve workspace scoping and MUST NOT co-mingle content across workspaces.

## Privacy & logging (MUST)
- Raw search queries MUST NOT be logged in plaintext. If logging is required for debugging or analytics, only hashed or redacted forms MAY be recorded (e.g., `sha256(query)` plus length/flags), with PII-safe fields only.
- Logs and traces MUST NOT contain user-entered query strings, filters containing PII, or result snippets.

## Observability (MUST)
- Metrics: record qps, success/error rates, P50/P90/P99 latency, result count distributions, and index freshness/staleness per workspace.
- Alerts: trigger on elevated error rate, P99 latency threshold breaches, and sustained index staleness beyond SLO.
- Tracing: include spans for query parse, FTS execution, post-filtering, and permission checks; omit raw query strings (use hash).

## Testing requirements (MUST)
- Isolation tests: queries scoped to workspace A MUST return only entities from A; ensure no cross-workspace leakage even via guessed IDs.
- Privacy tests: verify logs/traces do not contain raw queries; only hashed IDs appear.
- Observability tests: verify metrics counters and staleness gauges update as per spec.
