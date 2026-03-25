# Workspace Endpoints (agent-ref)

## Purpose
Provide exact, execution-focused REST endpoint contracts for workspace, membership, and invitation operations.

## Canonical Sources
- `docs/domains/workspaces/api-contracts.md`
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/spec/05-features/05.2-workspaces.md`
- `docs/spec/04-user-flows/04.4-workspace-creation.md`
- `docs/spec/04-user-flows/04.5-workspace-invitation.md`
- `docs/spec/09-api-standards/09.3-response-standards.md`
- `docs/spec/09-api-standards/09.4-error-standards.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/workspaces/api-contracts.md`
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/workspaces/role-model.md`
- `docs/domains/workspaces/security-rules.md`

## Scope
- Workspace CRUD, archive/unarchive, ownership transfer
- Membership role updates and removal
- Invitations (create, preview, accept, resend)
- Auth requirements, role requirements, and error codes

## Required Rules / Contract

### Base
- Base path: `/api/v1/workspaces`
- Auth required: `Authorization: Bearer <jwt>`
- All workspace endpoints enforce active membership and role unless explicitly noted.
- Workspace writes are blocked when `workspaces.status=archived` → `403 WORKSPACE_ARCHIVED_READONLY`.

### Workspace endpoints
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
  - Supports `X-Idempotency-Key` (workspace creation is idempotent).
  - Errors: `403 WORKSPACE_LIMIT_REACHED`, `400 VALIDATION_ERROR`.
- `GET /api/v1/workspaces/:workspaceId`
- `PUT /api/v1/workspaces/:workspaceId` (Admin+)
- `POST /api/v1/workspaces/:workspaceId/archive` (Admin+)
- `POST /api/v1/workspaces/:workspaceId/unarchive` (Admin+)
- `DELETE /api/v1/workspaces/:workspaceId` (Owner; soft delete)
- `POST /api/v1/workspaces/:workspaceId/transfer-ownership` (Owner)

**Transfer ownership rules (MUST)**
- `newOwnerUserId` must be a current member with role Admin or Manager (or elevated during transfer).
- After transfer, previous Owner becomes Admin.
- Errors: `400 INVALID_NEW_OWNER`, `403 FORBIDDEN`.

**Common errors**
- `403 NOT_WORKSPACE_MEMBER`
- `404 WORKSPACE_NOT_FOUND`
- `403 WORKSPACE_ARCHIVED_READONLY` (write operations)
- `403 WORKSPACE_LIMIT_REACHED` (create)

### Membership endpoints
- `GET /api/v1/workspaces/:workspaceId/members` (Viewer+)
- `PATCH /api/v1/workspaces/:workspaceId/members/:membershipId/role` (Admin+; Owner can set any)
  - Errors: `400 CANNOT_DEMOTE_OWNER`, `403 FORBIDDEN_ROLE_ASSIGNMENT`, `404 MEMBER_NOT_FOUND`
- `DELETE /api/v1/workspaces/:workspaceId/members/:membershipId` (Admin+ with constraints)
  - Errors: `400 CANNOT_REMOVE_OWNER`

### Invitation endpoints
- `POST /api/v1/workspaces/:workspaceId/invitations` (Admin+)
- `GET /api/v1/invitations/:token` (preview; auth optional)
- `POST /api/v1/invitations/:token/accept` (auth required)
- `POST /api/v1/workspaces/:workspaceId/invitations/:invitationId/resend` (Admin+)

**Invitation errors**
- `404 INVITATION_NOT_FOUND`
- `410 INVITATION_EXPIRED`
- `400 INVITATION_ALREADY_USED`
- `403 EMAIL_MISMATCH`
- `400 ALREADY_MEMBER`
- `403 WORKSPACE_MEMBER_LIMIT_REACHED` (on invite/accept)

## Edge Cases / Failure Modes
- Authenticated non-members must receive `403 NOT_WORKSPACE_MEMBER` consistently.
- Owner cannot be removed or demoted without transfer.
- Invitation is email-bound; accept must match invited email.
- When workspace archived, all writes return `WORKSPACE_ARCHIVED_READONLY`.

## Validation or Testing Notes
- Enforce one active Owner per workspace.
- Validate role assignment constraints across all membership mutations.
- Verify idempotent workspace creation returns original response on retry.
- Ensure invite flows handle expiry and reuse exactly.

## Related Files / Domains
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/idempotency.md`
- `docs/agent-ref/data/workspace-schema.md`
- `docs/agent-ref/events/domain-events.md`


