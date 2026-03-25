# Task Schema (agent-ref)

## Purpose
Provide a compact, execution-focused reference for task-related data models, constraints, indexes, and retention rules.

## Canonical Sources
- `docs/domains/tasks/data-model.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/tasks/linking.md`
- `docs/spec/08-data-model/08.6-tasks-columns-links.md`
- `docs/spec/05-features/05.5-tasks.md`
- `docs/spec/05-features/05.6-document-task-linking.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/tasks/data-model.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/tasks/linking.md`

## Scope
- `task_columns`, `tasks`, and `task_document_links` schemas
- Field-level constraints and enums
- Indexes required for correctness/perf
- Retention and deletion rules
- Workspace isolation requirements

## Required Rules / Contract

### Table: `task_columns`
Purpose: Configure canonical task columns per workspace.

Key fields:
- `workspace_id` (required)
- `name` (display label)
- `status` enum (canonical status value)
- `position` (decimal ordering)
- `is_hidden` (optional; P2)

Rules:
- Workspace-scoped; queries must filter by `workspace_id`.
- Columns provisioned by workspace template in v1 and may be read-only in UI.

### Table: `tasks`
Key fields:
- `workspace_id` (required)
- `title` (1–200 chars, required)
- `description` (plain text; max 10,000 chars)
- `status` enum: `backlog|todo|in_progress|in_review|done` (v1)
- `priority` enum: `low|medium|high|urgent`
- `assignee_id` (nullable; must be active workspace member)
- `reporter_id` (NOT NULL; creator; immutable in v1)
- `due_date` (date-only; recommended not in past)
- `labels` (text[]; max 10; each 1–30 chars; `[a-zA-Z0-9-]`)
- `position` (decimal ordering within status)
- `search_vector` (TSVECTOR; optional trigger)
- `created_at`, `updated_at`, `deleted_at` (soft delete)

Indexes (canonical):
- `(workspace_id, status, position)`
- `(workspace_id, assignee_id, due_date)`
- `(workspace_id, updated_at DESC)`
- GIN index on `search_vector`

### Table: `task_document_links`
Purpose: Link tasks to document anchors.

Key fields:
- `workspace_id` (required)
- `task_id` (FK)
- `document_id` (FK)
- `anchor` (JSONB optional; best-effort)
- `created_at`, `deleted_at` (soft delete)

Rules:
- Workspace-scoped; `task` and `document` MUST share `workspace_id`.
- Invalid anchors return `INVALID_ANCHOR` (malformed payload only).
- Deleted targets may leave links orphaned per retention policy.

## Edge Cases / Failure Modes
- Removed workspace member → set `assignee_id = null` and emit `task.unassigned_due_to_member_removal`.
- Archived workspace → writes blocked; tasks still readable.
- Soft-deleted tasks retained for 30 days before purge.

## Validation or Testing Notes
- Enforce enum values for `status` and `priority`.
- Enforce label constraints (count, length, allowed chars).
- Validate `assignee_id` membership at write time.
- Verify workspace isolation on all task and link queries.
- Confirm retention job purges soft-deleted tasks after 30 days.

## Related Files / Domains
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/business-rules.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/api/task-endpoints.md`
- `docs/agent-ref/data/enums.md`


