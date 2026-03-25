# workspaces/api-contracts

## Domain
Workspace and membership API contracts.

## Canonical Sources
- `docs/spec/05-features/05.2-workspaces.md` — §5.2 API contracts; membership/role rules
- `docs/spec/04-user-flows/04.4-workspace-creation.md` — FL-003 create workspace flow
- `docs/spec/04-user-flows/04.5-workspace-invitation.md` — FL-004 invitation flow
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes/pagination/errors
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes

## Included Topics
- Workspaces endpoints
- Membership endpoints
- Invitation endpoints

## Workspace endpoints (base `/api/v1/workspaces`)
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/:workspaceId`
- `PUT /api/v1/workspaces/:workspaceId` (Admin+)
- `POST /api/v1/workspaces/:workspaceId/archive` (Admin+)
- `POST /api/v1/workspaces/:workspaceId/unarchive` (Admin+)
- `DELETE /api/v1/workspaces/:workspaceId` (Owner; soft delete)
- `POST /api/v1/workspaces/:workspaceId/transfer-ownership` (Owner)

Transfer ownership rules (MUST):
- `newOwnerUserId` must be an existing member with role Admin or Manager (or elevated during transfer).
- After transfer, previous Owner becomes Admin.
- Errors: `400 INVALID_NEW_OWNER`, `403 FORBIDDEN`.

Common errors:
- `403 NOT_WORKSPACE_MEMBER`
- `404 WORKSPACE_NOT_FOUND`
- `403 WORKSPACE_ARCHIVED_READONLY` (for writes)
- `403 WORKSPACE_LIMIT_REACHED` (on create, if user limit reached)
- `403 WORKSPACE_MEMBER_LIMIT_REACHED` (on invite/accept)

## Members endpoints
- `GET /api/v1/workspaces/:workspaceId/members` (Viewer+)
- `PATCH /api/v1/workspaces/:workspaceId/members/:membershipId/role` (Admin+; Owner can set any)
  - errors: `400 CANNOT_DEMOTE_OWNER`, `403 FORBIDDEN_ROLE_ASSIGNMENT`, `404 MEMBER_NOT_FOUND`
- `DELETE /api/v1/workspaces/:workspaceId/members/:membershipId` (Admin+ with constraints)
  - errors: `400 CANNOT_REMOVE_OWNER`

## Invitations endpoints
- `POST /api/v1/workspaces/:workspaceId/invitations` (Admin+)
- `GET /api/v1/invitations/:token` (preview; auth optional)
- `POST /api/v1/invitations/:token/accept` (auth required)
- `POST /api/v1/workspaces/:workspaceId/invitations/:invitationId/resend` (Admin+)

Invitation errors:
- `404 INVITATION_NOT_FOUND`
- `410 INVITATION_EXPIRED`
- `400 INVITATION_ALREADY_USED`
- `403 EMAIL_MISMATCH`
- `400 ALREADY_MEMBER`
