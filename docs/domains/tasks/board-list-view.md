# tasks/board-list-view

## Domain
Board and list view implementation requirements.

## Canonical Sources
- `docs/spec/05-features/05.5-tasks.md` — §5.5.5 Kanban board; §5.5.6 list view
- `docs/spec/03-information-architecture/03.2-route-map.md` — routes
- `docs/spec/03-information-architecture/03.10-accessibility.md` — drag-and-drop accessibility requirements

## Included Topics
- Kanban columns mapping
- Drag-and-drop constraints and optimistic UI
- List view columns/filters/pagination

## Kanban board
Route: `/w/:workspaceId/tasks`

Requirements:
- Columns ordered by `task_columns.position`.
- Column header shows name + count and “+ Add Task” (Member+).
- Column maps display name to canonical `status`.
- Drag-and-drop:
  - optimistic UI
  - on API failure snap back + toast
  - show valid drop targets only
  - updates `status` + `position` atomically
- Ordering within column uses `tasks.position` decimals.

Accessibility:
- keyboard alternative to drag/drop required (canonical shortcut pattern: `M` to move, arrow keys to choose target, Enter to confirm).
- ARIA announcements on move success (e.g., “Task [title] moved to [column]”).

## List view
Route: `/w/:workspaceId/tasks/list`

Requirements:
- Server-side pagination (25/page default; allow 10/25/50/100).
- Sortable columns include: title, status, priority, assignee, due date, updated, comments.
- Columns include Labels (not sortable in v1).
- Filters include: status (multi-select), assignee (multi-select), priority (multi-select), due date range, search.
- Optional P2: labels filter.
