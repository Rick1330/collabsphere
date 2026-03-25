# collab/read-only-rules

## Domain
Realtime read-only enforcement rules for collaboration sessions.

## Canonical Sources
- `docs/spec/10-realtime/` — authorization and write rejection
- `docs/spec/05-features/` — locked/submitted/approved behavior
- `docs/spec/11-security/` — realtime security

## Included Topics
- Who may connect
- Who may publish updates
- Server-side enforcement requirements

## Connection vs editing
- Viewer: may connect and receive sync/awareness; must not be allowed to publish updates.
- Member+: may publish updates only if document is editable per status/lock/workspace policies.

## Conditions forcing read-only
- Workspace archived (write operations disabled)
- Document locked and user not allowed to edit under lock policy
- Academic status `submitted` or `approved` (Members read-only)
- Document deleted/archived

## Enforcement requirements
- Client-side disabling is not sufficient.
- Collaboration server must reject update messages when user is read-only.
- Permission changes mid-session must be applied: after downgrade, server rejects writes.
