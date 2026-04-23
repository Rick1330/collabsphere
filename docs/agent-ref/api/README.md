# API — Agent Execution Reference

## Purpose
Provide a compact, execution-focused index of CollabSphere API references for agents and implementers.

## Canonical Sources
- `docs/spec/09-api-standards/*` — global API conventions (envelopes, errors, pagination, auth, idempotency, rate limits)
- `docs/spec/12-errors/12.4-error-code-catalog.md` — canonical error codes
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — app realtime events (context for API side effects)
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — event names and envelope

## Domain Sources
- `docs/domains/auth/api-contracts.md`
- `docs/domains/workspaces/api-contracts.md`
- `docs/domains/templates/api-contracts.md`
- `docs/domains/documents/api-contracts.md`
- `docs/domains/tasks/api-contracts.md`
- `docs/domains/comments/api-contracts.md`
- `docs/domains/notifications/api-contracts.md`
- `docs/domains/search/api-contracts.md`
- `docs/domains/files/api-contracts.md`
- `docs/domains/admin/api-contracts.md`

## Scope
- Links to API endpoint references by domain
- Execution notes for agents: auth, error handling, idempotency, and rate limits

## Required Rules / Contract
- Base path: `/api/v1`.
- Access token via `Authorization: Bearer <jwt>`.
- Error envelope must include `error.code` and `requestId`.
- Pagination defaults: page size 25, max 100.
- Idempotency via `X-Idempotency-Key` for POST creates.
- Rate limiting must return `429 RATE_LIMITED` with `Retry-After`.

## Success Envelope Examples
Single resource:
```json
{
  "data": {
    "resource": {
      "id": "workspace_123"
    }
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

List resource:
```json
{
  "data": {
    "items": [
      {
        "id": "task_123"
      }
    ],
    "total": 1
  },
  "meta": {
    "requestId": "req_abc123",
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

Action response:
```json
{
  "data": {
    "message": "OK"
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

## Edge Cases / Failure Modes
- Authenticated non-member workspace access returns `403 NOT_WORKSPACE_MEMBER` consistently.
- Admin endpoints require global role `ADMIN`.
- Some endpoints are read-only when workspace is archived.

## Validation or Testing Notes
- Validate request/response envelopes and error codes across all endpoints.
- Ensure idempotent POSTs return the original response on retry.

## Index (by file)
- `auth-endpoints.md`
- `workspace-endpoints.md`
- `template-endpoints.md`
- `document-endpoints.md`
- `task-endpoints.md`
- `comment-endpoints.md`
- `notification-endpoints.md`
- `search-endpoints.md`
- `file-endpoints.md`
- `admin-endpoints.md`

## Related Files / Domains
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/rate-limits.md`
- `docs/agent-ref/rules/idempotency.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/events/socket-events.md`
