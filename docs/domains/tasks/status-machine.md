# tasks/status-machine

## Domain
Task status machine and enforcement rules.

## Canonical Sources
- `docs/spec/05-features/05.5-tasks.md` — §5.5.4 Statuses & State Machine
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `INVALID_TRANSITION`, `FORBIDDEN`
- `docs/spec/02-personas-roles/02.3-permission-matrix.md` — task move permissions (summary)

## Included Topics
- Canonical statuses
- Allowed transitions and actor constraints
- API behavior on invalid transitions
- Policy options called out in the spec

## Canonical statuses (v1)
- `backlog` (optional; template-enabled)
- `todo`
- `in_progress`
- `in_review`
- `done`

Optional (P2/P3):
- `cancelled`
- `archived` (system-only retention)

## Allowed transitions (v1)
| From | To | Allowed Actor | Notes |
|------|----|---------------|------|
| backlog | todo | Member+ | |
| todo | in_progress | Assignee OR Manager+ | If unassigned, Member can move only if they self-assign simultaneously (policy option) |
| in_progress | in_review | Assignee OR Manager+ | |
| in_review | in_progress | Manager+ | “Changes requested” / rework |
| in_review | done | Manager+ | Default for quality control |
| done | in_progress | Manager+ | Reopen |

## Policy options (MUST choose and enforce)
- **Unassigned → in_progress**:
  - Option A (recommended): allow Member to move only if self-assigning in same action.
  - Option B: deny unless Manager+ assigns first.
- **Member moving tasks they don’t own**:
  - Option A: deny with `403 FORBIDDEN` and clear UI message.
  - Option B: allow if policy explicitly permits (not default).

Record the chosen policy in `tasks/feature-spec.md` to avoid drift.

## Enforcement rules (MUST)
- Invalid transitions return `400 INVALID_TRANSITION`.
- Role/actor violations return `403 FORBIDDEN`.
- UI must prevent invalid transitions via disabled drop targets and messaging.
- Workspace archived policy overrides: all writes must return `403 WORKSPACE_ARCHIVED_READONLY`.

## Realtime
- Status changes emit `task.status_changed` domain event and `task:moved` realtime event (see `tasks/user-flows.md` and `tasks/README.md`).