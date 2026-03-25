# Task Endpoints

## Purpose
Provide an execution-focused reference for task-related REST endpoints, including routes, auth/role requirements, request/response shapes, error codes, invariants, and related event emissions.

## Canonical Sources
- `docs/domains/tasks/api-contracts.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/tasks/linking.md`
- `docs/spec/05-features/05.5-tasks.md` — §5.5 API contracts, status model
- `docs/spec/05-features/05.6-document-task-linking.md` — link endpoints and anchor rules
- `docs/spec/04-user-flows/04.7-task-lifecycle.md` — FL-006
- `docs/spec/09-api-standards/09.3-response-standards.md` — envelopes
- `docs/spec/09-api-standards/09.4-error-standards.md` — error envelope
- `docs/spec/09-api-standards/09.5-pagination.md` — pagination
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — Socket.IO events
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — domain event names

## Domain Sources
- `docs/domains/tasks/api-contracts.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/tasks/linking.md`

## Scope
- Task CRUD endpoints
- Board and list view queries
- Assignment and status transitions
- Document↔task link endpoints
- Error codes and invariants
- Realtime/event side effects

## Required Rules / Contract

### Base
- Base path: `/api/v1/workspaces/:workspaceId/tasks`
- Auth required (JWT).
- Workspace membership required for all endpoints.
- Archived workspace blocks writes: return `403 WORKSPACE_ARCHIVED_READONLY`.

### Endpoints (authoritative)

#### Create task
`POST /api/v1/workspaces/:workspaceId/tasks`
- Role: Member+
- Supports optional `source` for document selection linking.
- Idempotency: support `X-Idempotency-Key` (recommended for creates).
- `description` is plain text only in v1 (no rich text).

#### List tasks (list view)
`GET /api/v1/workspaces/:workspaceId/tasks?view=list`
Query params:
- `page`, `pageSize`
- `status=todo,in_progress`
- `assigneeId=<uuid>|unassigned`
- `priority=high,urgent`
- `dueBefore=YYYY-MM-DD`
- `dueAfter=YYYY-MM-DD`
- `search=...`
- `sortBy=createdAt|updatedAt|dueDate|priority|title`
- `sortOrder=asc|desc`

#### List tasks (board view)
`GET /api/v1/workspaces/:workspaceId/tasks?view=board`
Response groups by status:
- `columns[]` with `status`, `name`, `tasks[]`, `totalCount`, `hasMore`
- Optional lazy loading by `status` + pagination params.

#### Get task
`GET /api/v1/workspaces/:workspaceId/tasks/:taskId`

#### Update task
`PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId`
- Fields: title/description/priority/dueDate/labels (per validation rules).
- `description` must be plain text (max 10,000 chars).

#### Assign task
`PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId/assign`
- Assignee must be a workspace member.

#### Change status
`PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId/status`
- Enforce state machine (see `docs/agent-ref/rules/business-rules.md` and `tasks/status-machine`).

#### Delete task (soft delete)
`DELETE /api/v1/workspaces/:workspaceId/tasks/:taskId`

### Link endpoints
- `GET /api/v1/workspaces/:workspaceId/tasks/:taskId/links`
- `GET /api/v1/workspaces/:workspaceId/document-links/:linkId`

### Invariants
- Task and workspace must share `workspace_id`.
- Status transitions must follow canonical state machine.
- Assignee must be active workspace member.

### Errors (common)
- `403 NOT_WORKSPACE_MEMBER`
- `403 WORKSPACE_ARCHIVED_READONLY`
- `404 TASK_NOT_FOUND`
- `400 INVALID_ASSIGNEE`
- `400 INVALID_TRANSITION`
- `400 INVALID_DATE`
- `400 INVALID_LABEL`
- `400 VALIDATION_ERROR`

### Related events (domain + socket)
- Domain events (must match catalog): `task.created`, `task.updated`, `task.assigned`, `task.status_changed`, `task.deleted`, `task.created_from_document`
- Socket.IO (workspace room): `task:created`, `task:updated`, `task:moved`, `task:deleted`, `task:assigned`

## Edge Cases / Failure Modes
- Unassigned → `in_progress` must follow chosen policy; otherwise `403 FORBIDDEN` or `400 INVALID_TRANSITION`.
- Authenticated non-members must receive `403 NOT_WORKSPACE_MEMBER` (consistent across endpoints).
- Archived workspace blocks all writes with `WORKSPACE_ARCHIVED_READONLY`.
- Status change while assignee removed: handle `assignee_id = null` and emit `task.unassigned_due_to_member_removal` event (data-layer rule).
- Realtime unavailable → clients poll board/list every 10–15s and show “Live updates unavailable” banner.

## Validation or Testing Notes
- Validate enum values for `status`, `priority`.
- Enforce label constraints (max 10, 1–30 chars, `[a-zA-Z0-9-]`).
- Ensure idempotent create returns original response for repeated key.
- Test RBAC: Viewer cannot create/modify tasks.
- Test state machine transitions and forbidden transitions.
- Verify Socket.IO events are scoped to `workspace:<workspaceId>` and are lightweight (clients refetch if needed).

## Related Files / Domains
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/business-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/data/task-schema.md`


