# activity-audit/events

## Domain
Activity & Audit — event mapping, payload expectations, and separation rules.

## Canonical Sources
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.4 Activity Event Types; §5.8.5 Audit Event Types; §5.8.8 event-driven mapping
- `docs/spec/05-features/05.1-authentication.md` — §5.1.10 auth/security audit events
- `docs/spec/05-features/05.2-workspaces.md` — §5.2.10 workspace events
- `docs/spec/05-features/05.4-documents.md` — §5.4.14 document events
- `docs/spec/05-features/05.5-tasks.md` — §5.5.16 task events
- `docs/spec/04-user-flows/04.8-commenting-mentions.md` — comment events
- `docs/spec/05-features/05.7-files-attachments.md` — file/attachment events
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — canonical event envelope + names
- `docs/spec/11-security/11.10-audit-logging.md` — audit logging rules
- `docs/spec/13-observability/13.3-structured-logging.md` — logging/privacy constraints

## Included Topics
- Canonical event envelope
- Activity feed event catalog (user-facing)
- Audit log event catalog (security/compliance)
- Mapping rules and separation
- Coalescing/noise controls
- Payload requirements and privacy

## Event envelope (MUST)
All internal events use the canonical envelope:
```docs/domains/activity-audit/events.md#L1-240
{
  "eventId": "evt_01J2...",
  "name": "task.assigned",
  "occurredAt": "2025-07-17T12:00:00Z",
  "actor": { "userId": "uuid", "workspaceId": "uuid-or-null" },
  "data": { }
}
```

## Activity feed events (MUST, v1)
Activity feed is user-facing and workspace-scoped. Canonical event keys include:

### Workspace
- `workspace.created`
- `workspace.member_joined`
- `workspace.member_removed`
- `workspace.member_role_changed` (or `workspace.role_changed` per spec section)
- `workspace.archived`
- `workspace.unarchived`

### Documents
- `document.created`
- `document.renamed`
- `document.moved`
- `document.locked`
- `document.unlocked`
- `document.submitted` (academic)
- `document.reviewed` (academic)

### Tasks
- `task.created`
- `task.assigned`
- `task.status_changed`
- `task.completed` (if represented separately in feed; derived from status change)

### Comments
- `comment.created`
- `comment.thread_resolved`

### Files (v1.1+)
- `file.uploaded` (optional; avoid noise)

**Granularity rule (MUST):**
- Do NOT emit per-keystroke events.
- Document edits must be coalesced or omitted per §5.8.4.4.

## Audit log events (MUST, v1)
Audit log is admin-facing and immutable. Canonical action keys include:

### Auth & Security
- `security.login_failed`
- `security.login_succeeded`
- `security.oauth_failed`
- `security.password_reset_requested`
- `security.password_reset_completed`
- `security.password_changed`
- `security.refresh_failed`
- `user.registered`
- `user.verification_sent`
- `user.email_verified`
- `user.login_succeeded`
- `user.logged_out`
- `user.refresh_succeeded`

### Admin
- `admin.user_deactivated`
- `admin.user_reactivated`
- `admin.user_sessions_revoked`
- `admin.workspace_archived`
- `admin.workspace_unarchived`
- `admin.workspace_force_deleted`
- `admin.role_changed`

### Workspace & Data
- `workspace.role_changed`
- `workspace.ownership_transferred`
- `workspace.deleted`
- `data.export_requested`
- `data.export_downloaded`

### Files (v1.1+)
- `file.download_url_issued`

**Audit payload MUST include**:
- `requestId`, `actorId` (nullable), `actorEmail`, `actorGlobalRole`
- `workspaceId` (optional), `targetType`, `targetId`
- `ipAddress`, `userAgent`
- `severity`, `metadata`, `createdAt`

## Mapping rules (MUST)
- Activity feed and audit log are separate systems. Do not mix.
- Security-sensitive actions MUST go to the audit log, even if summarized in activity.
- Activity feed entries may be coalesced/updated for UX; audit log is append-only.

## Coalescing rules (MUST)
- Document edits: at most one `document.edited` per user per document per 5-minute window (if implemented).
- If coalescing is implemented, update timestamp or skip duplicate entries within the window.
- It is acceptable in v1 to omit `document.edited` entirely and only log lifecycle events.

## Privacy & safety (MUST)
- Never log secrets, tokens, presigned URLs, or raw search queries.
- For anchor/quote-related metadata, log hash + length only.

## Traceability notes
- Event names must match `docs/spec/18-appendices/18.1-domain-event-catalog.md`.
- If an event is not in the canonical catalog, do not add it here; update the spec first.
