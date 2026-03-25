# workspaces/data-model

## Domain
Workspace persistence model.

## Canonical Sources
- `docs/spec/08-data-model/` — workspaces, workspace_members, workspace_settings, invitations
- `docs/spec/05-features/` — §5.2 data model

## Included Topics
- Tables + key columns
- Ownership invariant
- Email-bound invitations

## Tables

### workspaces
Key fields:
- `type`: professional|academic|general
- `status`: active|archived
- `owner_id`
- `deleted_at` for soft delete

### workspace_members
Key fields:
- `(workspace_id, user_id)` unique for active memberships
- `role`: OWNER|ADMIN|MANAGER|MEMBER|VIEWER
- `is_active` + `left_at`

Ownership invariant:
- Exactly one active Owner per workspace.
- Canonical spec suggests optional partial unique index for owner role.

### workspace_settings
- JSONB `settings` including:
  - `submissionWorkflowEnabled` (default true for academic workspaces, false otherwise)
  - `allowViewerCommentsOnDocs` (default true)
  - `allowViewerCommentsOnTasks` (default false)
- `allowViewerExport` (viewer export allowed only if true)
  - `roleLabels` mapping (cosmetic labels by workspace type)

### invitations
- Email-bound in v1 (`invited_email` must match accepting user email)
- Store only `token_hash` (sha256)
- `expires_at` default 7 days
- Status: pending|accepted|expired|revoked

Recommended rule:
- Creating a new invite for the same workspace+email revokes existing pending invites.
