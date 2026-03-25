# workspaces/README

## Domain
Workspace container model: creation, types (professional/academic/general), settings, membership management, invitations, and workspace-scoped RBAC and isolation policies.

## Canonical Sources
- `docs/spec/04-user-flows/04.4-workspace-creation.md` — FL-003 Workspace creation
- `docs/spec/04-user-flows/04.5-workspace-invitation.md` — FL-004 Invitation flow
- `docs/spec/05-features/05.2-workspaces.md` — Workspaces feature spec (§5.2)
- `docs/spec/02-personas-roles/02.2-role-architecture.md` — two-level roles + permission matrices
- `docs/spec/08-data-model/08.4-workspaces-memberships.md` — workspaces/members/settings/invitations tables
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — workspace isolation + RBAC enforcement
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes (NOT_WORKSPACE_MEMBER, archived policy, limits)
- `docs/spec/15-testing/15.6-required-test-suites.md` — testing requirements and isolation tests
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — workspace domain event catalog

## Included Topics
- Workspace lifecycle (active/archived/deleted)
- Membership and role enforcement
- Invitation token model + accept flow
- Workspace isolation requirements (IDOR prevention)
- API contracts and data model
- Edge cases and limits/quotas
- Testing requirements

## Related domains
- `auth/` (identity and sessions)
- `templates/` (workspace initialization uses templates)
- `documents/`, `tasks/`, `comments/`, `files/` (workspace-scoped resources)
- `activity-audit/` (activity events + audit entries for role changes)
- `admin/` (admin workspace management overrides)
- `quality/` (security baseline + NFRs)
