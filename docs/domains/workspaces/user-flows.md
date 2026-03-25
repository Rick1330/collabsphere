# workspaces/user-flows

## Domain
Workspace creation and invitation flows.

## Canonical Sources
- `docs/spec/04-user-flows/` — FL-003 Workspace creation; FL-004 Invitation
- `docs/spec/05-features/` — §5.2 membership rules

## Included Topics
- Workspace creation wizard behavior
- Invitation creation and acceptance
- Role assignment constraints

## FL-003 — Workspace creation (type + template)

Canonical steps:
- Route: `/workspaces/new`
- Wizard steps:
  1) Workspace details (name required 3–60; description ≤280; icon optional)
  2) Select type (professional/academic/general)
  3) Select template (filtered by type; general can default to blank)
  4) Review & create

Server action:
- `POST /api/v1/workspaces`
- Must be transactional across:
  - workspace row
  - owner membership row
  - workspace settings + role label mapping
  - folders/documents seeded by template
  - task columns seeded by template
  - activity event `workspace.created`

Edge cases:
- Template missing → `404 TEMPLATE_NOT_FOUND`
- Partial template failure → rollback + `TEMPLATE_APPLICATION_FAILED`
- Workspace limits → `403 WORKSPACE_LIMIT_REACHED`
- Name conflict (if enforced) → `409 WORKSPACE_NAME_CONFLICT`
- Duplicate create due to retries → idempotency key recommended

## FL-004 — Workspace invitation (invite → accept → join)

Invite creation:
- `POST /api/v1/workspaces/:workspaceId/invitations`
- Role required: Admin+ (or Manager+ if enabled by policy)
- Token is random 32–64 bytes base64url; store only `token_hash = sha256(token)`.
- Expires: 7 days.

Accept invite:
- Public frontend route `/invite/:token`.
- UI must handle unauthenticated users: prompt login/register/OAuth then return to `/invite/:token`.
- Acceptance API: `POST /api/v1/invitations/:token/accept`.
- Must validate:
  - token_hash matches pending invitation
  - not expired
  - invitation is email-bound: logged-in user email matches `invited_email`
  - workspace exists

Role assignment constraints at invite time:
- Inviter can assign at most one level below their own role (Owner exception can assign any).

Edge cases:
- Already member → `400 ALREADY_MEMBER` (then redirect to workspace)
- Expired → `410 INVITATION_EXPIRED`
- Already used → `400 INVITATION_ALREADY_USED`
- Email mismatch → `403 EMAIL_MISMATCH`
