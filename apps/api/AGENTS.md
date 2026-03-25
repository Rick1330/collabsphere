# AGENTS.md

## Purpose
Local rules for the NestJS API (REST + Socket.IO) service.

## Scope
`apps/api` controllers, services, DTOs, modules, and API-adjacent logic.

## Must Follow
- Use NestJS layering: controller → service → persistence (Prisma) with DTOs and validation pipes.
- Enforce RBAC with guards; validate workspace membership and role on every workspace route.
- All workspace-owned queries must include `workspace_id` and active membership.
- Never allow resource-id-only access patterns (IDOR risk).
- Use standard response envelopes and canonical error codes via AppError (no raw errors).
- DTO validation must mirror canonical validation rules (no custom drift).
- List endpoints must implement pagination (`page`, `pageSize`) and enforce max page size.
- Emit domain events after successful state changes; Socket.IO events must align with the event catalog.
- Document REST endpoints return metadata only; no Yjs/CRDT content in REST responses.

## Never Do
- Bypass guards or workspace isolation checks.
- Access another module’s tables directly; use the owning service boundary.
- Emit per-keystroke activity or notification events.
- Return raw database errors or stack traces to clients.

## Tests / Validation
- Add unit tests for service logic and validators when behavior changes.
- Add integration tests for RBAC, scoping, and error code mapping.
- Verify response envelopes and error codes match canonical definitions.

## References
### API Contracts
- `docs/agent-ref/api/README.md`
- `docs/agent-ref/api/auth-endpoints.md`
- `docs/agent-ref/api/workspace-endpoints.md`
- `docs/agent-ref/api/document-endpoints.md`
- `docs/agent-ref/api/task-endpoints.md`
- `docs/agent-ref/api/comment-endpoints.md`
- `docs/agent-ref/api/notification-endpoints.md`
- `docs/agent-ref/api/search-endpoints.md`

### Data / Schema
- `docs/agent-ref/data/workspace-schema.md`
- `docs/agent-ref/data/document-schema.md`
- `docs/agent-ref/data/task-schema.md`
- `docs/agent-ref/data/comment-schema.md`
- `docs/agent-ref/data/notification-schema.md`

### Rules
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/validation-rules.md`

### Events
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/events/activity-rules.md`
