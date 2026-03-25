# Integration Test Writer

## Purpose
Create integration tests that validate RBAC, isolation, side effects, and API contracts.

## When to Use
- Any changes to API endpoints, RBAC, or cross-service flows.

## Required Inputs / Context
- API contract, error codes, and event expectations.

## Read First
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/api/*-endpoints.md`

## Workflow
1. Test authenticated/non-member access returns `403 NOT_WORKSPACE_MEMBER`.
2. Verify workspace scoping across reads/writes.
3. Validate response envelopes and error codes.
4. Confirm domain events and side effects (notifications/activity) if applicable.

## Dangerous Mistakes
- Skipping cross-workspace denial tests.
- Not asserting error envelopes and codes.

## Validation Expectations
- Run tests with DB/Redis services available.
- Cover success and failure paths.

## Escalation Conditions
- Tests require new fixtures or cross-module setup not yet defined.

## Related Skills / References
- `implementation/nestjs-api-endpoint.md`
- `guardrail/workspace-isolation.md`
