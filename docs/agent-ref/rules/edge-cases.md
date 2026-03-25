# Edge Cases (agent-ref)

## Purpose
Provide an execution-focused catalog of high-impact edge cases and expected behaviors across CollabSphere domains.

## Canonical Sources
- `docs/domains/auth/errors-edge-cases.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/documents/hierarchy.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/tasks/linking.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/search/feature-spec.md`
- `docs/domains/files/lifecycle.md`
- `docs/domains/collab/failure-modes.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/auth/errors-edge-cases.md`
- `docs/domains/workspaces/security-rules.md`
- `docs/domains/documents/hierarchy.md`
- `docs/domains/documents/versioning-export.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/tasks/status-machine.md`
- `docs/domains/tasks/linking.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`
- `docs/domains/search/feature-spec.md`
- `docs/domains/files/lifecycle.md`
- `docs/domains/collab/failure-modes.md`

## Scope
- Cross-domain edge cases that affect correctness, safety, or permissions.
- Expected error codes and degraded behaviors.
- Idempotency and retention edge cases.

## Required Rules / Contract

### Auth & Sessions
- Non-enumerating responses for resend verification and forgot-password.
- Refresh token reuse after rotation must revoke the token family (recommended).
- Deactivated account: access token may remain valid until expiry; refresh MUST fail.
- OAuth account with same email as local: deny; no auto-link.
- OAuth-only user requesting password reset: return generic 200; no reset email.

### Workspace & Membership
- Non-member access returns `403 NOT_WORKSPACE_MEMBER` consistently.
- Owner cannot be removed/demoted without ownership transfer.
- Invitations are email-bound; accept must match `invited_email`.
- Archived workspace blocks all writes with `WORKSPACE_ARCHIVED_READONLY`.

### Documents & Hierarchy
- Deleting non-empty folder MUST return `FOLDER_NOT_EMPTY`.
- Folder move under itself/descendant MUST return `INVALID_PARENT`.
- REST MUST NOT return editable CRDT/Yjs content (metadata-only).
- Export requests are async; missing job returns `EXPORT_JOB_NOT_FOUND`.
- Document delete is soft and disallowed when status is `submitted` or `approved` (`DOCUMENT_READONLY_STATUS`).

### Collab
- Collab server down → document opens read-only with banner + retry; render last persisted snapshot if available.
- DB down → sync may continue; persistence fails; retry and surface degraded mode.
- Permission downgrade mid-session → server rejects updates immediately.

### Tasks & Linking
- Invalid status transitions must return `INVALID_TRANSITION`.
- Unassigned → `in_progress` must follow chosen policy (deny or self-assign).
- Cross-workspace linking is forbidden: return `WORKSPACE_MISMATCH`.
- Invalid anchor payload → `INVALID_ANCHOR`; resolution failure degrades UI only.
- Member removed → `assignee_id=null` and emit `task.unassigned_due_to_member_removal`.

### Comments & Mentions
- Malformed anchor payloads rejected with `INVALID_ANCHOR` (not for later resolution failure).
- Deleting parent comment with replies retains thread and shows placeholder.
- Mentions must be active workspace members; invalid mentions → `INVALID_MENTION`.
- Edit window exceeded → `EDIT_WINDOW_EXPIRED`.

### Notifications
- Unknown preference keys MUST be rejected (`VALIDATION_ERROR`).
- Notification dispatch uses eventId idempotency; no duplicates.
- Removed member retains history but receives no new notifications.

### Search
- Empty query → `400 VALIDATION_ERROR`.
- Overlong query (>200 chars) → `400 VALIDATION_ERROR`.
- Global search restricted to user’s workspaces; no cross-workspace leakage.
- Raw queries must never be logged (hash only).

### Files
- Pending uploads older than 1 hour → mark `failed` and cleanup.
- File `status != ready` blocks attach/download (`FILE_NOT_READY`).
- Download URL issuance must re-check membership/ACL at access time.
- Storage outage → `STORAGE_UNAVAILABLE`.

## Edge Cases / Failure Modes
- Non-member access returns `403 NOT_WORKSPACE_MEMBER` consistently.
- Idempotent POST retries must return original response; no duplicates.
- Retention jobs must not delete active or referenced records.

## Validation or Testing Notes
- Ensure each edge case is covered by integration tests where applicable.
- Verify error codes match `docs/spec/12-errors/12.4-error-code-catalog.md`.
- Confirm degraded UX behaviors for collab outages and permission changes.

## Related Files / Domains
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/collab/collaboration-failure-modes.md`
- `docs/agent-ref/api/*-endpoints.md`


