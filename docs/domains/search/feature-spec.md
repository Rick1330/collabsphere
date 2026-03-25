# search/feature-spec

## Domain
Search feature spec: query behavior, result rules, isolation, and error handling.

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — FL-009 search modes, query behavior, ranking, API, edge cases
- `docs/spec/05-features/05.4-documents.md` — document search fields (title + plaintext)
- `docs/spec/05-features/05.5-tasks.md` — task search fields (title + description)
- `docs/spec/06-nfrs/06.2-performance.md` — search latency targets
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation and RBAC
- `docs/spec/12-errors/12.4-error-code-catalog.md` — validation and access errors
- `docs/spec/13-observability/13.3-structured-logging.md` + `13.4-metrics.md` — logging/metrics constraints

## Included Topics
- Supported query types and filters
- Search modes (workspace/global/admin)
- Result behavior and ranking
- Isolation and permission rules
- Error handling and limits
- Performance constraints and observability

## Search modes (MUST)
1. **Workspace-scoped search** (default inside a workspace).
2. **Global search** (across all workspaces the user belongs to).
3. **Admin global search** (platform admin only, under `/admin/*`).

## Query types (MUST)
- Keyword search with prefix and fuzzy matching where specified.
- Filters must support:
  - `type` (documents, tasks)
  - `status`
  - `author` (when applicable)
  - `date range`
- Scoping defaults to current `workspace_id` when in workspace context.

## Result behavior (MUST)
- Highlighting: return snippets with highlighted search terms.
- Grouping: results may be grouped by entity type (Documents, Tasks).
- Ordering: must follow canonical ranking rules (see `ranking.md`).
- Result fields:
  - Documents: title, snippet, workspace name (global), last updated time, URL
  - Tasks: title, status badge, assignee, workspace name (global), due date (optional)

## Ranking rules (MUST)
- Documents:
  - Title matches weighted highest.
  - Content plaintext weighted medium.
  - Recency boost is optional (P2).
- Tasks:
  - Title weighted highest.
  - Description weighted medium.
  - Status not used for scoring (display only).

## Isolation & permissions (MUST)
- Workspace search:
  - Must validate membership in that workspace.
  - Must not return entities outside the workspace.
- Global search:
  - Must join against `workspace_members` to limit to user’s workspaces.
- Admin search:
  - Must require global role `ADMIN` and admin routes only.
  - Not membership-scoped; scope all workspaces/users in admin context; exclude soft-deleted entities.
- All results must be permissions-aware; for admin search, permission is the admin guard (not workspace membership).

## Content indexing assumptions (MUST)
- Documents must use derived plaintext (`documents.content_plaintext`) for search.
- Tasks use `title` + `description` fields.
- CRDT/Yjs content must not be decoded on-demand for each query.

## Error handling (canonical)
- `400 VALIDATION_ERROR` — missing/invalid query, bad params
- `403 FORBIDDEN` — workspace not accessible
- `404 WORKSPACE_NOT_FOUND` — invalid workspaceId
- Avoid returning sensitive details in error messages.

## Limits & guardrails (MUST)
- Empty query: UI disables submit; API returns 400.
- Very long query (>200 chars): truncate client-side and return 400 if exceeded.
- Query with special characters: use `websearch_to_tsquery` to handle safely.

## Performance constraints (MUST)
- Workspace search latency target: **< 500ms**.
- Global search latency target: **< 800ms**.
- Use indexed FTS fields and enforce query timeouts where needed.

## Observability & privacy (MUST)
- Do NOT log raw query strings in production logs.
- Log hash only (e.g., `sha256(query)`), plus length and scope.
- Metrics (minimum):
  - `search.query.count`
  - `search.query.latency_ms` (p50/p95/p99)
  - `search.query.error.count`
  - `search.query.db_time_ms`
  - `search.query.result_count` (histogram)

## Edge cases (MUST)
- Stale plaintext index for CRDT docs is acceptable within short lag.
- Large workspace/global scopes must paginate and cap per-type results.
- Non-English text may require `simple` dictionary or future language selection (v2).

## Non-goals (v1)
- Comment search is optional (v1.1+).
- Cross-workspace search without membership is forbidden.
