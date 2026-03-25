# Rules — Agent Execution Reference

## Purpose
Fast, execution-focused policy pack for CollabSphere agents. This layer condenses critical rules (validation, permissions, invariants, error codes, rate limits, idempotency, isolation) into a retrieval-friendly index and points to the exact agent-ref subfiles for implementation.

## Canonical Sources
- `docs/spec/09-api-standards/09.8-authorization.md` — RBAC enforcement rules
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation requirements
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes
- `docs/spec/11-security/11.6-rate-limits-abuse-prevention.md` + `docs/spec/09-api-standards/09.9-rate-limits.md` — rate limits
- `docs/spec/09-api-standards/09.6-idempotency.md` — idempotency
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md` — validation/sanitization

## Domain Sources (approved)
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/auth/security.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/documents/feature-spec.md`
- `docs/domains/files/security.md`
- `docs/domains/search/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`

## Scope
- Workspace isolation and RBAC enforcement
- Validation rules and invariants
- Error code usage and mapping
- Rate limits and abuse prevention
- Idempotency requirements
- Security rules and policy constraints

## Required Rules / Contract (Index)
Use the following files for exact, implementable rules:

- `validation-rules.md` — canonical field constraints, sanitization rules, input limits
- `business-rules.md` — domain-specific invariants and policy rules (e.g., ownership, archived behavior)
- `edge-cases.md` — known failure modes and expected behavior
- `error-codes.md` — exact error codes and when to emit them
- `workspace-isolation.md` — must-level workspace scoping rules
- `security-rules.md` — authentication, authorization, and sensitive-action guards
- `rate-limits.md` — endpoint-level limits and Retry-After expectations
- `idempotency.md` — POST idempotency contracts and keys

## Edge Cases / Failure Modes
- Non-member workspace access must return `403 NOT_WORKSPACE_MEMBER` consistently (see `workspace-isolation.md`).
- Do not leak entity existence across workspaces or users.
- Never rely on client-side checks for permissions or read-only status.

## Validation or Testing Notes
- All rules in this group are **MUST** for automated validation and testing gates.
- Use these references in ExecPlans, task kernels, and AGENTS.md workflows for guardrail checks.

## Related Files / Domains
- API layer: `docs/agent-ref/api/*-endpoints.md`
- Data layer: `docs/agent-ref/data/*-schema.md`
- Events: `docs/agent-ref/events/*`
- Collab: `docs/agent-ref/collab/*`
- UI policy surfaces: `docs/agent-ref/ui/*`
