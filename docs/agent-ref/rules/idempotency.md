# Idempotency (agent-ref)

## Purpose
Provide an execution-focused reference for idempotency requirements, headers, and behavior across CollabSphere endpoints.

## Canonical Sources
- `docs/spec/09-api-standards/09.6-idempotency.md`
- `docs/spec/09-api-standards/09.3-response-standards.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`
- `docs/domains/templates/application-engine.md`
- `docs/domains/workspaces/api-contracts.md`
- `docs/domains/documents/api-contracts.md`
- `docs/domains/tasks/api-contracts.md`

## Domain Sources
- `docs/domains/templates/application-engine.md`
- `docs/domains/workspaces/api-contracts.md`
- `docs/domains/documents/api-contracts.md`
- `docs/domains/tasks/api-contracts.md`

## Scope
- Idempotency header and behavior for POST create endpoints
- Storage strategy and TTL expectations
- Conflict handling and error codes
- Recommended endpoints for idempotency support

## Required Rules / Contract

### Header
- Use `X-Idempotency-Key: <uuid>` for POST endpoints that create resources.

### Standard behavior (MUST)
- If the same idempotency key is reused by the **same user** within TTL:
  - Return the **original response** (including resource identifiers).
  - Do **not** create a duplicate resource.
- If the same key is reused with a **different payload**:
  - Return `409 IDEMPOTENCY_CONFLICT`.
- Idempotency keys are scoped by `(userId, endpoint, idempotencyKey)`.

### Storage
- Store idempotency keys in DB or Redis.
- TTL recommendation: 24 hours (or per implementation policy).
- Key storage must include:
  - userId
  - endpoint
  - request hash
  - response payload
  - createdAt / expiresAt

### Endpoints requiring idempotency (P1)
- `POST /api/v1/workspaces`
- `POST /api/v1/workspaces/:workspaceId/documents`
- `POST /api/v1/workspaces/:workspaceId/tasks`
- `POST /api/v1/workspaces/:workspaceId/invitations`
- `POST /api/v1/workspaces/:workspaceId/documents/:documentId/export`

### Recommended
- Apply idempotency to any POST that creates a durable resource or enqueues a user-visible job.

## Edge Cases / Failure Modes
- Network retries or double submit must not create duplicate resources.
- Different payloads with same key must return `IDEMPOTENCY_CONFLICT`.
- Expired keys may create new resources (expected behavior); clients should use fresh keys for new actions.

## Validation or Testing Notes
- Ensure same key returns identical response payload and status.
- Confirm duplicate POSTs do not create multiple rows.
- Verify conflict behavior when payload differs.
- Verify TTL expiry behavior is consistent with policy.

## Related Files / Domains
- `docs/agent-ref/api/*-endpoints.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/data/*-schema.md`


