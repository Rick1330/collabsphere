## Canonical Sources
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.4 Activity Feed Specifications
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — activity updates over Socket.IO

## Included Topics
- Event types surfaced in the activity feed
- Coalescing rules for bursts of similar events
- Workspace and permission scoping for activity visibility

## Scope & audience (MUST)
- Activity feed MUST be user-facing and workspace-scoped.
- Entries MUST be visible only to members with permission to view the underlying entities.

## Coalescing and granularity (MUST)
- MUST NOT emit per-keystroke activity items.
- MUST group edits into meaningful units within a **5-minute window** (e.g., show "Edited document" once per window per user per document as per §5.8.4.4).

## Mutability & retention (MUST)
- Activity feed entries MAY be updated or coalesced for relevance.
- Retention MUST be shorter (e.g., 180 days) than the audit log.
- MUST NOT include secrets or raw query strings.
