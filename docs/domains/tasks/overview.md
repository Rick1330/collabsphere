# tasks/overview

## Domain
Tasks overview.

## Canonical Sources
- `docs/spec/05-features/` — §5.5 Tasks

## Included Topics
- Task purpose and priorities
- Permissions summary
- Realtime update requirement

## Scope (v1)
- Task CRUD within workspace
- Kanban board (default) + list view (P1)
- Assignment constraints (Manager+ assigns to others)
- Status machine enforcement
- Due dates and reminders (P1)

## Permissions summary
- Viewer: read-only.
- Member: create tasks; edit/delete own; move own tasks subject to state machine.
- Manager+: assign to others, edit/delete any, bulk ops.

## Realtime
Task updates must broadcast to workspace members in realtime (Socket.IO room `workspace:<workspaceId>`).
