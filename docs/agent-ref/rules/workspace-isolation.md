# Workspace Isolation (agent-ref)

## Purpose
Define the exact workspace isolation rules that must be enforced across REST, realtime, background jobs, and derived indexes.

## Canonical Sources
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/workspaces/role-model.md`
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md`
- `docs/spec/09-api-standards/09.8-authorization.md`
- `docs/spec/08-data-model/08.1-entities.md`
- `docs/spec/13-observability/13.1-logging-metrics.md`

## Domain Sources
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/workspaces/role-model.md`

## Scope
- Workspace scoping for all entity access
- Authorization checks for REST and realtime
- Isolation for background jobs and derived indexes
- Archived workspace write blocking
- IDOR prevention

## Required Rules / Contract
- Every workspace-owned entity MUST include `workspace_id`.
- All reads, writes, updates, deletes, and background jobs MUST filter by `workspace_id` and active membership.
- Resource IDs alone MUST NOT grant access (IDOR prevention).
- Search, notifications, and activity feeds MUST be workspace-scoped in non-admin contexts (admin global search is an exception under `/api/v1/admin/*`).
- Derived indexes (e.g., `content_plaintext`, FTS vectors) MUST preserve workspace scoping.
- Realtime rooms MUST enforce membership on every connect/reconnect:
  - `workspace:<workspaceId>` requires active membership.
  - `doc:<documentId>` requires membership in the document’s workspace.
- Archived workspace policy: block all writes with `WORKSPACE_ARCHIVED_READONLY`.
- Authenticated non-members MUST receive `403 NOT_WORKSPACE_MEMBER` (v1 policy).

## Edge Cases / Failure Modes
- Non-member access must return `403 NOT_WORKSPACE_MEMBER` consistently (no 404 for authenticated users).
- Cached authorizations MUST NOT bypass current membership checks.
- Cross-workspace entity references (e.g., file attachments, task links) MUST be rejected.

## Validation or Testing Notes
- IDOR tests: user in workspace A cannot access workspace B resources by ID.
- Search tests: queries must only return entities from authorized workspaces.
- Notifications/Activity tests: delivery must only reach members of originating workspace.
- Realtime tests: joining unauthorized rooms must fail on connect and on reconnect.

## Related Files / Domains
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/api/*-endpoints.md`
- `docs/agent-ref/data/*-schema.md`
- `docs/agent-ref/events/*`


