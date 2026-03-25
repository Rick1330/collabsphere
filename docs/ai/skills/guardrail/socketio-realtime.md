# Socket.IO Realtime Guardrail

## Purpose
Enforce safe app-level realtime rules separate from collaboration realtime.

## When to Use
- Any Socket.IO events, rooms, or realtime delivery changes.

## Required Inputs / Context
- Event names and payload expectations.

## Read First
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/rules/security-rules.md`
- `apps/api/AGENTS.md`
- `apps/web/AGENTS.md`

## Workflow
1. Keep Socket.IO for app events only (tasks/notifications/activity).
2. Ensure room naming and authorization (`user:<id>`, `workspace:<id>`).
3. Emit only canonical event names with minimal payloads.
4. Enforce fallback polling intervals when sockets fail:
   - Notifications: every 30s.
   - Task board/list: every 10–15s.
   - Activity feed: every 15–30s.

## Dangerous Mistakes
- Mixing Socket.IO and Hocuspocus responsibilities.
- Emitting per-keystroke events.
- Allowing unauthorized room joins.

## Validation Expectations
- Verify room authorization and reconnect behavior.
- Validate payload contents and event names.

## Escalation Conditions
- New event types not in the event catalog.

## Related Skills / References
- `guardrail/collab-hocuspocus.md`
- `implementation/nestjs-api-endpoint.md`
- `apps/api/AGENTS.md`
- `apps/web/AGENTS.md`
