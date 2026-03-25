# workspaces/feature-spec

## Domain
Workspace management feature spec.

## Canonical Sources
- `docs/spec/05-features/` — §5.2 Workspaces
- `docs/spec/02-personas-roles/` — role matrices and role mapping by workspace type
- `docs/spec/12-errors/` — quotas and workflow errors

## Included Topics
- Workspace CRUD and settings
- Membership management
- Workspace limits/quotas
- Type-specific defaults and role label mapping

## Workspace settings (v1)
Admin+ can update:
- name (3–60)
- description (≤280)
- icon

Type change:
- canonical spec indicates type is locked after creation in v1.

## Membership management
Pages/routes:
- Members list: `/w/:workspaceId/members` (Viewer+)
- Settings: `/w/:workspaceId/settings` (Admin+)

Actions:
- Invite (Admin+; Owner can invite any role)
- Remove member (Owner can remove anyone; Admin can remove Manager and below)
- Change roles (Owner any; Admin up to Manager)
- Owner cannot leave without transferring ownership.

## Limits/quotas (v1 defaults)
- max workspaces per user: 20 → `WORKSPACE_LIMIT_REACHED`
- max members per workspace: 50 → `WORKSPACE_MEMBER_LIMIT_REACHED`
- max documents per workspace: 500 → `DOCUMENT_LIMIT_REACHED`
- max tasks per workspace: 2,000 → `TASK_LIMIT_REACHED`

## Archived workspace behavior
Writes blocked with `WORKSPACE_ARCHIVED_READONLY`.
