# tasks/data-model

## Domain
Tasks persistence model.

## Canonical Sources
- `docs/spec/08-data-model/08.6-tasks-columns-links.md` — task_columns, tasks, task_document_links
- `docs/spec/05-features/05.5-tasks.md` — §5.5 model notes and constraints
- `docs/spec/12-errors/12.4-error-code-catalog.md` — task validation and workflow errors

## Included Topics
- task columns mapping
- task table fields and indexes
- linking table

## task_columns
- workspace-scoped
- `name` display label (e.g., “Review”)
- `status` canonical enum value
- `position` decimal ordering
- `is_hidden` optional (P2)
- Columns are provisioned by workspace template in v1 and may be read-only in UI.

## tasks
Key fields:
- `status`: backlog|todo|in_progress|in_review|done
- `priority`: low|medium|high|urgent
- `description`: plain text (max 10,000 chars; v1)
- `assignee_id` nullable; must be workspace member (validated in service)
- `reporter_id` NOT NULL (creator; immutable in v1)
- `due_date` date-only
- `labels` text[] (max 10; 1–30 chars each)
- `position` decimal ordering within status
- `search_vector` TSVECTOR (optional trigger)
- `created_at`, `updated_at`, `deleted_at` (soft delete)

Indexes (canonical):
- `(workspace_id, status, position)`
- `(workspace_id, assignee_id, due_date)`
- `(workspace_id, updated_at DESC)`
- GIN index on `search_vector`

Retention (canonical):
- Soft delete tasks (`deleted_at`).
- Retention default: 30 days; purge job removes tasks after retention.
- If a member is removed from workspace, set `assignee_id = null` and emit `task.unassigned_due_to_member_removal`.

## task_document_links
- workspace-scoped
- `anchor` JSONB optional
- indexes by task and by document
