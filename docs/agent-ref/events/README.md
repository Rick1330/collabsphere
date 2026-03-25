# Events — Agent Execution Reference

## Purpose
Provide a compact, execution-focused index of event catalogs, socket events, and activity/notification rules for agents and implementers.

## Canonical Sources
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — canonical event names and envelope
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — Socket.IO system and rooms
- `docs/spec/05-features/05.8-activity-audit.md` — activity vs audit separation and coalescing
- `docs/spec/04-user-flows/04.9-notifications.md` — notification dispatch rules and realtime payloads
- `docs/spec/11-security/11.10-audit-logging.md` — audit immutability and access control

## Domain Sources
- `docs/domains/activity-audit/events.md`
- `docs/domains/activity-audit/activity-feed.md`
- `docs/domains/activity-audit/audit-log.md`
- `docs/domains/notifications/events.md`
- `docs/domains/notifications/realtime.md`

## Scope
- Domain event envelope and canonical names
- Socket.IO app events and rooms
- Activity feed vs audit log rules
- Notification dispatch and dedupe rules

## Required Rules / Contract
- All internal domain events MUST use the canonical envelope (`eventId`, `name`, `occurredAt`, `actor`, `data`).
- Event names MUST match the canonical catalog; do not invent new names here.
- Activity feed is workspace-scoped and user-facing; audit log is admin-only and immutable.
- No per-keystroke activity events; use coalescing rules where required.
- Notification dispatch must be idempotent and preference-aware.

## Edge Cases / Failure Modes
- Event replay must not create duplicate notifications (use `eventId` idempotency).
- Activity coalescing must not remove required audit events (audit log is append-only).
- Socket reconnects require room rejoin; do not assume persistent room membership.

## Validation or Testing Notes
- Validate event names against the canonical catalog.
- Verify socket events only reach authorized rooms.
- Ensure activity/audit separation and retention policies are enforced.

## Related Files / Domains
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/events/activity-rules.md`
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/workspace-isolation.md`
