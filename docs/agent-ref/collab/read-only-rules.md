# Collab Read-Only Rules (agent-ref)

## Purpose
Define exact read-only enforcement rules for collaboration sessions and document editing, including server-side requirements and policy triggers.

## Canonical Sources
- `docs/domains/collab/read-only-rules.md`
- `docs/domains/collab/hocuspocus.md`
- `docs/domains/collab/overview.md`
- `docs/domains/documents/feature-spec.md`
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md`
- `docs/spec/11-security/11.8-realtime-security.md`
- `docs/spec/05-features/05.4-documents.md`

## Domain Sources
- `docs/domains/collab/read-only-rules.md`
- `docs/domains/collab/hocuspocus.md`
- `docs/domains/collab/overview.md`
- `docs/domains/documents/feature-spec.md`

## Scope
- Read-only access rules for Hocuspocus/Yjs sessions
- Conditions that force read-only mode
- Server-side enforcement requirements
- Mid-session permission changes

## Required Rules / Contract
- **Connection vs editing**:
  - Viewer: may connect and receive sync/awareness; MUST NOT be allowed to publish updates.
  - Member+: may publish updates only if document is editable per status/lock/workspace policies.
- **Read-only triggers (MUST)**:
  - Workspace archived → writes blocked.
  - Document locked → only lock owner or Admin/Owner can edit; all others read-only.
  - Academic status `submitted` or `approved` → Members read-only.
  - Document deleted/archived → read-only (or reject connection if required by policy).
- **Server-side enforcement (MUST)**:
  - Client-side disabling is insufficient.
  - Collaboration server MUST reject update messages for read-only users.
  - Permission changes mid-session MUST take effect immediately; subsequent updates rejected.
- **Room auth**:
  - Room `doc:<documentId>` requires active workspace membership.
  - Authorization must re-check membership and document state on each connect/reconnect.

## Edge Cases / Failure Modes
- Permission downgrade while connected: server rejects writes; client must show read-only banner.
- Collab server down: document opens read-only with banner and retry loop.
- DB down: sync can continue temporarily; persistence fails; read-only may be enforced if document state cannot be verified.

## Validation or Testing Notes
- Verify read-only enforcement is server-side for Viewer and locked/submitted/approved cases.
- Test mid-session role change and lock toggle behavior.
- Ensure archived workspace blocks edits via collab and REST.
- Confirm reconnect requires re-authorization and respects updated permissions.

## Related Files / Domains
- `docs/agent-ref/collab/hocuspocus-hooks.md`
- `docs/agent-ref/collab/yjs-state-model.md`
- `docs/agent-ref/collab/collaboration-failure-modes.md`
- `docs/agent-ref/api/document-endpoints.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/workspace-isolation.md`


