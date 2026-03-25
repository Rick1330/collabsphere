# search/api-contracts

## Domain
Search API contracts (workspace/global/admin search), including query params, response schema, and errors.

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — §4.10.12 API Contracts; §4.10.13 Security & RBAC
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes, pagination, errors
- `docs/spec/12-errors/12.4-error-code-catalog.md` — validation and access errors
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation and membership rules

## Included Topics
- Search endpoint and query params
- Workspace/global/admin scope rules
- Response schema and pagination
- Error codes and guardrails

## Endpoint (authoritative)

### `GET /api/v1/search`

Query params:
- `q` (required)
- `scope=global|workspace`
- `workspaceId` (required if `scope=workspace`)
- `types=documents,tasks` (optional)
- `page` (default 1)
- `pageSize` (default 25)

Example:
`GET /api/v1/search?q=login+page&scope=workspace&workspaceId=uuid&types=documents,tasks&page=1&pageSize=25`

Response (200):
```docs/domains/search/api-contracts.md#L33-86
{
  "data": {
    "query": "login page",
    "scope": "workspace",
    "workspaceId": "uuid",
    "results": {
      "documents": [
        {
          "id": "doc-uuid",
          "title": "Authentication Requirements",
          "snippet": "…users must be able to <mark>login</mark> using email/password…",
          "updatedAt": "2025-07-17T12:10:00Z",
          "url": "/w/uuid/documents/doc-uuid"
        }
      ],
      "tasks": [
        {
          "id": "task-uuid",
          "title": "Implement login page",
          "snippet": "Build the <mark>login</mark> UI and connect auth endpoints…",
          "status": "in_progress",
          "priority": "high",
          "dueDate": "2025-08-01",
          "url": "/w/uuid/tasks/task-uuid"
        }
      ]
    }
  },
  "meta": {
    "pagination": { "page": 1, "pageSize": 25, "totalItems": 7, "totalPages": 1 }
  }
}
```

## Scope rules (MUST)
- `scope=workspace`: validate membership in `workspaceId` and filter results by that workspace.
- `scope=global`: restrict to workspaces where user is a member (join on `workspace_members`).
- Admin global search is only available on admin routes with global role `ADMIN` (not via normal user scope).

## Errors (canonical)
- `400 VALIDATION_ERROR` — missing/invalid query, bad params
- `403 FORBIDDEN` — workspace not accessible or unauthorized scope
- `404 WORKSPACE_NOT_FOUND` — invalid workspaceId

## Guardrails
- Empty query → UI disables submit; API returns 400.
- Overlong query (>200 chars) → truncate client-side; API returns 400 if exceeded.
- Avoid leaking sensitive details in error messages.

## Notes
- Search results must always be permission-aware and workspace-scoped.
- Raw queries must not be logged; log only hashed/redacted forms (see search README).
