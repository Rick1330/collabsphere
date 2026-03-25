# tasks/user-flows

## Domain
Task lifecycle flow.

## Canonical Sources
- `docs/spec/04-user-flows/` — FL-006
- `docs/spec/05-features/` — §5.5

## Included Topics
- Create task
- Assign task
- Move across board (status transitions)
- Realtime broadcast side effects

## FL-006 — Create → Assign → Move

### Create
- `POST /api/v1/workspaces/:workspaceId/tasks` (Member+)
- Insert task with status + `position` ordering.
- Emit domain event `task.created` → activity + realtime + notifications (if assigned).

### Assign
- `PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId/assign`
- Role: Manager+ (Members may self-assign if enabled by policy).
- Validate assignee is workspace member else `400 INVALID_ASSIGNEE`.
- Emit `task.assigned` → notify recipient.

### Move/status change
- `PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId/status`
- Validate transition, else `400 INVALID_TRANSITION`.
- Enforce actor constraints (assignee or Manager+ depending on transition).
- Update `status` + `position` atomically.
- Emit realtime `task:moved` event.

### Realtime fallback
If realtime unavailable, poll task board/list every 10–15s and show “Live updates unavailable” banner.
