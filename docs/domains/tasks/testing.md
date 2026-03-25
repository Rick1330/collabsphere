# tasks/testing

## Domain
Tasks testing requirements.

## Canonical Sources
- `docs/spec/05-features/05.5-tasks.md` — §5.5.18 Testing Requirements; §5.5.17 Edge Cases
- `docs/spec/04-user-flows/04.7-task-lifecycle.md` — FL-006 task lifecycle
- `docs/spec/12-errors/12.4-error-code-catalog.md` — INVALID_TRANSITION, INVALID_ASSIGNEE, INVALID_DATE, INVALID_LABEL
- `docs/spec/08-data-model/08.6-tasks-columns-links.md` — tasks schema and retention rules
- `docs/spec/15-testing/15.6-required-test-suites.md` — tasks required suites

## Included Topics
- State machine validator tests
- Integration tests for ordering, assignment, and status changes
- E2E for board/list behavior and realtime updates
- Reminder job tests for due soon/overdue
- Edge-case coverage (archived workspace, invalid transitions, member removal)

## Unit
- Transition validator
- Due date overdue computation
- Label validation
- Position calculation

## Integration
- Create task assigns correct position and reporterId
- Move task updates status+position atomically
- Assign task validates member and emits notifications
- Invalid transitions return `400 INVALID_TRANSITION`
- Invalid assignee returns `400 INVALID_ASSIGNEE`
- Invalid due date returns `400 INVALID_DATE`
- Invalid label returns `400 INVALID_LABEL`
- Archived workspace blocks writes (`WORKSPACE_ARCHIVED_READONLY`)
- Member removed from workspace nulls assignee and emits `task.unassigned_due_to_member_removal`
- List filters/sort/pagination work as specified

## E2E
- Create task from board
- Drag between columns; observe realtime update in second browser
- Attempt invalid transition; UI blocks with clear message
- Assign task; notification appears
- Due date reminder job triggers notifications (mock time/cron)
- List view filter/sort
- Archived workspace disables create/edit controls

## Linking E2E
- Create task from document selection; task shows linked resource; deep-link jump resolves anchor when possible.
