# Search Endpoints (agent-ref)

## Purpose
Provide an execution-focused reference for search REST endpoints, including parameters, scope rules, response shape, error codes, and guardrails.

## Canonical Sources
- `docs/domains/search/api-contracts.md`
- `docs/domains/search/feature-spec.md`
- `docs/domains/search/indexing.md`
- `docs/spec/04-user-flows/04.10-search.md` — §4.10 API + behavior
- `docs/spec/09-api-standards/09.3-response-standards.md` — envelopes
- `docs/spec/09-api-standards/09.4-error-standards.md` — error envelope
- `docs/spec/09-api-standards/09.5-pagination.md` — pagination
- `docs/spec/09-api-standards/09.8-authorization.md` — workspace authorization
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation rules

## Domain Sources
- `docs/domains/search/api-contracts.md`
- `docs/domains/search/feature-spec.md`
- `docs/domains/search/indexing.md`

## Scope
- `GET /api/v1/search` endpoint
- Workspace/global/admin search scopes
- Query parameters and response shape
- Permission isolation and error codes
- Guardrails (query length, empty query)

## Required Rules / Contract

### Endpoint
`GET /api/v1/search`

Query params:
- `q` (required)
- `scope=global|workspace`
- `workspaceId` (required if `scope=workspace`)
- `types=documents,tasks` (optional)
- `page` (default 1)
- `pageSize` (default 25; max 100)

### Scope rules (MUST)
- `scope=workspace`: validate membership in `workspaceId`; return only entities in that workspace.
- `scope=global`: return only entities from workspaces where the user is an active member (join on `workspace_members`).
- Admin global search is **admin-only** and must live under admin routes (not exposed via normal user scope).
  - Not membership-scoped; scope is all workspaces/users in admin context.
  - Exclude soft-deleted entities.

### Response shape
- Use standard list envelope with `data` and `meta.pagination`.
- Results grouped by entity type (documents/tasks) per canonical spec.

### Errors (canonical)
- `400 VALIDATION_ERROR` — missing/invalid params, empty query, overlong query
- `403 FORBIDDEN` — workspace not accessible or unauthorized scope
- `404 WORKSPACE_NOT_FOUND` — invalid workspaceId

### Guardrails (MUST)
- Empty query → API returns 400.
- Query length > 200 chars → return 400 (client should truncate).
- No sensitive details in error messages.
- Do not log raw queries (hash only; see rules).

## Edge Cases / Failure Modes
- Non-member workspace search must return `403 NOT_WORKSPACE_MEMBER`.
- Stale plaintext index is acceptable within short lag, but must never leak data across workspaces.
- Very large scopes must paginate and cap per-type results.

## Validation or Testing Notes
- Validate `scope` and `workspaceId` combinations.
- Verify workspace isolation for both `workspace` and `global` scopes.
- Confirm response grouping and pagination metadata.
- Ensure raw query strings are not logged.

## Related Files / Domains
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/rate-limits.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/data/task-schema.md`


