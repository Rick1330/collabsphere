# workspaces/role-model

## Domain
Role model and permission enforcement architecture for workspace-scoped resources.

## Canonical Sources
- `docs/spec/02-personas-roles/` — §2.2 two-level role system; §2.3 permission matrices; §2.7 enforcement architecture
- `docs/spec/11-security/` — RBAC and workspace isolation

## Included Topics
- Global role vs workspace role separation
- Workspace role hierarchy and invariants
- Permission enforcement algorithm
- Implications for API design (guards)

## Two-level role system

### Global role (on User)
- `USER`
- `ADMIN` (platform admin)

### Workspace role (on WorkspaceMember)
- `OWNER` (exactly one per workspace)
- `ADMIN`
- `MANAGER`
- `MEMBER`
- `VIEWER`

Hierarchy is strict; higher inherits lower.

## Role assignment rules (highlights)
- Exactly one Owner per workspace at all times.
- Owner cannot leave/demote self without transferring ownership.
- Admin can assign up to Manager; cannot assign Admin/Owner.
- Inviting role cap: inviter can assign up to one level below their own (Owner can assign any).

## Enforcement architecture (3 layers)
1. Authentication: JWT required; missing/expired → `401`.
2. Platform role check: admin routes require global role `ADMIN` → `403` otherwise.
3. Workspace role check:
   - Extract `workspaceId` from URL
   - Query membership (`workspace_members`) where active
   - If none → `403 NOT_WORKSPACE_MEMBER`
   - Compare role level to required minimum

RBAC check algorithm is defined in canonical spec; implementations should mirror it.

## Realtime implications
- Workspace role changes must take effect immediately:
  - next API call enforces new role
  - collaboration sessions must reject writes after downgrade
