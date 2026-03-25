# tasks/README

## Domain
Tasks domain: task CRUD, status state machine, Kanban board and list view behavior, assignment rules, due dates/reminders, realtime updates for tasks, and linking tasks to documents.

## Canonical Sources
- `docs/spec/04-user-flows/04.7-task-lifecycle.md` — FL-006 Task lifecycle
- `docs/spec/05-features/05.5-tasks.md` — §5.5 Tasks
- `docs/spec/02-personas-roles/02.3-permission-matrix.md` — task permissions summary
- `docs/spec/05-features/05.6-document-task-linking.md` — §5.6 Document ↔ Task Linking
- `docs/spec/08-data-model/08.6-tasks-columns-links.md` — tasks, task_columns, task_document_links tables
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — Socket.IO task event payloads/rooms
- `docs/spec/12-errors/12.4-error-code-catalog.md` — INVALID_TRANSITION, INVALID_ASSIGNEE, INVALID_DATE, quotas
- `docs/spec/15-testing/15.6-required-test-suites.md` — tasks testing requirements

## Included Topics
- Task field constraints + validation
- Status transition rules (authoritative state machine)
- Board/list view behaviors and ordering strategy
- Assignment permissions
- Realtime event payloads for task updates
- Document linking/anchors (best-effort)
- Testing requirements

## Related domains
- `workspaces/` (RBAC, archived policy)
- `notifications/` (task assignment/reminder notifications)
- `comments/` (task comments and mentions)
- `documents/` (link targets and deep linking)
- `activity-audit/` (activity events for task changes)
