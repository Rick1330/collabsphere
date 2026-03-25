# workspaces/overview

## Domain
Workspaces: the primary collaboration boundary.

## Canonical Sources
- `docs/spec/05-features/05.2-workspaces.md` — §5.2 Workspaces
- `docs/spec/02-personas-roles/02.2-role-architecture.md` — role architecture summary
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — workspace isolation and RBAC enforcement

## Included Topics
- Workspace definition and scoping
- Workspace types and what they affect
- Lifecycle (archive/delete) and read-only policy

## Workspace definition
A workspace is the atomic collaboration container. All documents, tasks, comments, files, activity, and permissions MUST be scoped to a workspace. Workspace isolation MUST be absolute.

## Workspace types
Types:
- `professional`
- `academic`
- `general`

Canonical rules:
- Type affects defaults and feature flags (e.g., academic submission workflow) and UI role labels.
- Permission system MUST be identical across types in v1.

## Lifecycle
States:
- `active`
- `archived`
- `deleted` (soft-deleted via `deleted_at`; access MUST return 404)

Archived workspace policy (v1):
- View MUST be allowed to all members.
- Create/edit documents/tasks/files MUST be blocked for Member/Viewer/Manager.
- Owner/Admin can unarchive.
- Member management MAY remain allowed; invites SHOULD be blocked unless unarchived (per spec recommendation).
- UI MUST show banner “Archived (read-only)”.
