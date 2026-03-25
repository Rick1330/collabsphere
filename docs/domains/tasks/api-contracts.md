# tasks/api-contracts

## Domain
Tasks REST API contracts.

## Canonical Sources
- `docs/spec/05-features/05.5-tasks.md` — §5.5 API contracts
- `docs/spec/05-features/05.6-document-task-linking.md` — link-related endpoints
- `docs/spec/04-user-flows/04.7-task-lifecycle.md` — FL-006
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — pagination/envelopes
- `docs/spec/12-errors/12.4-error-code-catalog.md` — codes
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — task realtime events

## Included Topics
- CRUD endpoints
- Board vs list queries
- Assign/status endpoints
- Link endpoints

## Endpoints
Base: `/api/v1/workspaces/:workspaceId/tasks`

- `POST /.../tasks`
  - may include optional `source` for document selection linking
- `GET /.../tasks` with `view=list|board` and filters
- `GET /.../tasks/:taskId`
- `PATCH /.../tasks/:taskId` (title/desc/priority/dueDate)
- `PATCH /.../tasks/:taskId/assign`
- `PATCH /.../tasks/:taskId/status`
- `DELETE /.../tasks/:taskId` (soft delete)

### List view filters (canonical)
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

### Board view response shape
`GET /api/v1/workspaces/:workspaceId/tasks?view=board`

Response groups tasks by status:
- `columns[]` with `status`, `name`, `tasks[]`, `totalCount`, `hasMore`
- Optional lazy loading per column supported by `status` + pagination params

Link endpoints:
- `GET /api/v1/workspaces/:workspaceId/tasks/:taskId/links`
- `GET /api/v1/workspaces/:workspaceId/document-links/:linkId`

Common errors:
- `404 TASK_NOT_FOUND`
- `403 NOT_WORKSPACE_MEMBER`
- `400 INVALID_ASSIGNEE`
- `400 INVALID_TRANSITION`
- `400 INVALID_DATE`
- `403 WORKSPACE_ARCHIVED_READONLY` for writes

## Realtime notes
- Task mutations emit Socket.IO events to `workspace:<workspaceId>`:
  - `task:created`, `task:updated`, `task:moved`, `task:deleted`, `task:assigned`.
- Clients should treat events as lightweight and refetch detail if needed.
