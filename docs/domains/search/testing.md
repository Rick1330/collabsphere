## Domain
Search — Testing

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — acceptance criteria for search
- `docs/spec/06-nfrs/06.2-performance.md` — search latency and P99 requirements
- `docs/spec/13-observability/13.1-logging-metrics.md` — observability for search
- `docs/spec/15-testing/15.6-required-test-suites.md` — search testing requirements

## Included Topics
- Unit and integration tests for indexing and query logic
- End-to-end tests for permissions-aware and workspace-scoped search
- Relevance/ranking test cases
- Performance and load testing against NFR targets
- Regression tests for search-related bugs
- Privacy/observability tests for query logging and metrics

## MUST test cases
- Isolation: ensure all queries filter by `workspace_id`; verify no cross-workspace results under any permutations (filters, pagination, sorting).
- Background jobs: verify derived indexes and reindexers preserve workspace scoping.
- Privacy: assert raw query strings never appear in logs/traces; only hashed/redacted variants may appear.
- Observability: assert metrics (qps, error rate, P50/P90/P99) and staleness gauges are emitted; create synthetic slow queries to test alerts.
- Access time checks: ensure file/download results in search are re-validated at access time, not only at index time, and unauthorized access is blocked.
