# Activity Rules (agent-ref)

## Purpose
Define execution-focused rules for the activity feed, including event selection, coalescing, visibility, retention, and separation from audit logging.

## Canonical Sources
- `docs/domains/activity-audit/activity-feed.md`
- `docs/domains/activity-audit/events.md`
- `docs/domains/activity-audit/overview.md`
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.4 Activity Feed Specs
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — activity updates via Socket.IO
- `docs/spec/11-security/11.10-audit-logging.md` — separation rules
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — event names

## Domain Sources
- `docs/domains/activity-audit/activity-feed.md`
- `docs/domains/activity-audit/events.md`
- `docs/domains/activity-audit/overview.md`

## Scope
- Activity feed event selection and mapping
- Coalescing and noise-control rules
- Workspace scoping and permission gating
- Retention policy
- Separation from audit log

## Required Rules / Contract

### Activity feed scope
- Activity feed is **user-facing** and **workspace-scoped**.
- Entries MUST be visible only to members who can access the underlying entities.

### Event selection (v1)
Canonical event keys include:
- Workspace: `workspace.created`, `workspace.member_joined`, `workspace.member_removed`, `workspace.member_role_changed`, `workspace.archived`, `workspace.unarchived`
- Documents: `document.created`, `document.renamed`, `document.moved`, `document.locked`, `document.unlocked`, `document.submitted`, `document.reviewed`
- Tasks: `task.created`, `task.assigned`, `task.status_changed`, `task.completed` (if derived)
- Comments: `comment.created`, `comment.thread_resolved`
- Files: `file.uploaded` (optional, v1.1+; avoid noise)

Event names MUST match the canonical catalog in `docs/spec/18-appendices/18.1-domain-event-catalog.md`.

### Coalescing / noise control (MUST)
- **No per-keystroke activity events.**
- Document edits must be coalesced into a single activity item within a **5-minute window** per user per document.
- Coalescing may update an existing feed item timestamp rather than creating duplicates.
- It is acceptable in v1 to omit `document.edited` entirely and only log lifecycle events.

### Separation from audit log (MUST)
- Activity feed entries may be coalesced/updated.
- Audit log entries are **immutable** and **admin-only**.
- Security-sensitive actions must be recorded in the audit log even if a summary appears in activity.

### Retention
- Activity feed retention MUST be **shorter** than audit log (e.g., 180 days).

### Privacy & Safety
- Never include secrets, tokens, presigned URLs, or raw search queries.
- For anchor/quote metadata, store hash + length only.

## Edge Cases / Failure Modes
- Activity feed must not expose entities a user cannot access (permission gating on render).
- If coalescing is enabled, it must not suppress mandatory audit log entries.
- Workspace membership changes must take effect immediately for feed visibility.
- Socket outages: clients fall back to polling activity feed every 15–30s.

## Validation or Testing Notes
- Verify activity feed entries are workspace-scoped and permission-aware.
- Confirm 5-minute coalescing window for document edits.
- Ensure no per-keystroke events are emitted.
- Validate separation from audit log (no audit-only events in activity feed).

## Related Files / Domains
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/security-rules.md`


