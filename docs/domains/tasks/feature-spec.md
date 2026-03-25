# tasks/feature-spec

## Domain
Tasks feature spec and constraints.

## Canonical Sources
- `docs/spec/05-features/05.5-tasks.md` — §5.5 Tasks (fields, validation, due dates, reminders)
- `docs/spec/12-errors/12.4-error-code-catalog.md` — validation + workflow codes
- `docs/spec/08-data-model/08.6-tasks-columns-links.md` — tasks schema and constraints

## Included Topics
- Required task fields
- Validation rules
- Priorities and due date semantics

## Required task fields + constraints
- title: 1–200 chars (required)
- description: max 10,000 chars (plain text only in v1)
- status: enum
- priority: low|medium|high|urgent
- assigneeId: nullable; must be workspace member
- reporterId: set from auth user
- dueDate: date-only; recommended not in past
- labels: max 10; each 1–30 chars; `[a-zA-Z0-9-]` only
- position: decimal ordering within status column

## Due date semantics
- Due date is date-only.
- Overdue if `dueDate < today` and status not done/cancelled.
- Recommended: reject past due dates with `INVALID_DATE`.

## Error codes
- `VALIDATION_ERROR`
- `INVALID_ASSIGNEE`
- `INVALID_DATE`
- `INVALID_LABEL`
- `INVALID_TRANSITION`
- `WORKSPACE_ARCHIVED_READONLY`
