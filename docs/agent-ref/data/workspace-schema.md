# Workspace Schema (agent-ref)

## Purpose
Provide an execution-focused schema reference for workspaces, memberships, settings, and invitations with exact constraints and lifecycle rules.

## Canonical Sources
- `docs/domains/workspaces/data-model.md`
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/spec/08-data-model/08.4-workspaces-memberships.md`
- `docs/spec/05-features/05.2-workspaces.md`
- `docs/spec/02-personas-roles/02.2-role-architecture.md`
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/workspaces/data-model.md`
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/workspaces/security-rules.md`

## Scope
- `workspaces`
- `workspace_members`
- `workspace_settings`
- `invitations`
- Ownership invariants, role constraints, and workspace-scoping rules

## Required Rules / Contract

### workspaces
Key fields:
- `id` UUID PK
- `type`: `professional|academic|general`
- `status`: `active|archived`
- `owner_id` UUID FK → users
- `deleted_at` (soft delete)

Constraints:
- Exactly one active Owner per workspace.
- `type` is immutable after creation in v1.
- All workspace-owned entities must include `workspace_id`.

### workspace_members
Key fields:
- `workspace_id` UUID FK
- `user_id` UUID FK
- `role`: `OWNER|ADMIN|MANAGER|MEMBER|VIEWER`
- `is_active`, `left_at`

Constraints:
- Unique `(workspace_id, user_id)` for active memberships.
- Owner cannot leave/demote without transfer.
- Role assignment limits:
  - Owner can assign any.
  - Admin can assign up to Manager (not Admin/Owner).
  - Invites can assign at most one level below inviter.

### workspace_settings
Key fields:
- JSONB `settings` with defaults:
  - `submissionWorkflowEnabled` (default true for academic, false otherwise)
  - `allowViewerCommentsOnDocs` (default true)
  - `allowViewerCommentsOnTasks` (default false)
  - `allowViewerExport` (default false unless template overrides)
  - `roleLabels` (cosmetic, workspace type–specific)

Constraints:
- Settings updates are Admin+.
- If workspace archived, writes across domain entities are blocked.

### invitations
Key fields:
- `workspace_id`, `invited_email`, `role`
- `token_hash` (sha256)
- `expires_at` (default 7 days)
- `status`: `pending|accepted|expired|revoked`

Constraints:
- Email-bound in v1: accepting user email must match `invited_email`.
- Creating a new invite for same workspace+email should revoke existing pending invite.

## Edge Cases / Failure Modes
- Workspace archived: all writes return `WORKSPACE_ARCHIVED_READONLY`.
- Non-member access: return `403 NOT_WORKSPACE_MEMBER` consistently.
- `WORKSPACE_LIMIT_REACHED` and `WORKSPACE_MEMBER_LIMIT_REACHED` errors must be enforced at create/invite/accept.
- Ownership transfer requires Admin/Manager target; previous Owner becomes Admin.

## Validation or Testing Notes
- Enforce one active Owner invariant.
- Validate role assignment constraints on every change.
- Invite acceptance must verify email match and expiry.
- Workspace isolation: all queries must filter by `workspace_id`.

## Related Files / Domains
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/api/workspace-endpoints.md`
- `docs/agent-ref/data/enums.md`


