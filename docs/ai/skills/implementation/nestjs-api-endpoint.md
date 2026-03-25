# NestJS API Endpoint

## Purpose
Implement a NestJS REST endpoint that conforms to CollabSphere API contracts and guardrails.

## When to Use
- Adding or modifying API endpoints in `apps/api`.

## Required Inputs / Context
- Endpoint contract in `docs/agent-ref/api/*`.
- Relevant data schemas and validation rules.

## Read First
- `apps/api/AGENTS.md`
- `docs/agent-ref/api/README.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`

## Workflow
1. Confirm endpoint path, role requirements, and envelope shape.
2. Implement controller → service → persistence flow with DTO validation.
3. Enforce workspace scoping and RBAC via guards.
4. Use AppError with canonical error codes.
5. Emit domain events after successful state change.
6. Add pagination for list endpoints.
7. Keep task boundaries clean: API behavior, audit logging, and docs updates should be separate tasks unless the change is tiny and inseparable.

## Dangerous Mistakes
- Resource-id-only access without workspace scoping.
- Returning non-canonical error codes or envelopes.
- Returning CRDT/Yjs content via REST.

## Validation Expectations
- Unit tests for validators and service logic.
- Integration tests for RBAC, scoping, and error mapping.
- Include negative-path checks where applicable:
  - 401/403 for unauthorized or non-member access.
  - 429 for rate-limited endpoints.
  - Non-enumerating responses for auth flows.
  - Token reuse/invalid/expired failures where relevant.

## Escalation Conditions
- Endpoint behavior not covered by agent-ref contracts.

## Related Skills / References
- `guardrail/workspace-isolation.md`
- `guardrail/auth-session-security.md`
- `implementation/integration-test-writer.md`
