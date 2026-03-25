# notifications/realtime

## Domain
Realtime delivery of notifications over Socket.IO.

## Canonical Sources
- `docs/spec/04-user-flows/04.9-notifications.md` — §4.9.6 Channels; §4.9.11 Realtime events; payload schema
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — Socket.IO auth and room model
- `docs/spec/11-security/11.8-realtime-security.md` — room authorization rules
- `docs/spec/13-observability/13.3-structured-logging.md` — logging constraints (no sensitive payloads)

## Included Topics
- Socket.IO rooms for notification delivery
- Realtime events and payload schema
- Delivery guarantees and fallback
- Security constraints for room joins
- Noisy-event prevention

## Rooms (MUST)
- Each recipient socket joins `user:<userId>`.
- Server MUST prevent joining another user’s room.
- Workspace rooms are optional for announcements, but per-user rooms remain the primary delivery mechanism.

## Events (MUST)
Server → client:
- `notification:new`
- `notification:count`

Optional (v1+):
- `notification:read`
- `notification:batch_read`

## Payload schema (notification:new) (MUST)
```coloe/docs/domains/notifications/realtime.md#L1-200
{
  "id": "notif-uuid",
  "type": "task.assigned",
  "workspaceId": "workspace-uuid",
  "title": "Task assigned to you",
  "body": "Implement login page",
  "actor": { "id": "user-uuid", "fullName": "Jane Doe", "avatarUrl": null },
  "resource": { "type": "task", "id": "task-uuid" },
  "isRead": false,
  "createdAt": "2025-07-17T12:00:00Z"
}
```

## Delivery guarantees
- In-app delivery is considered successful once the notification is persisted; realtime push is best-effort.
- If Socket.IO is unavailable, clients MUST fall back to polling (see `notifications/api-contracts.md`).
- Fallback polling interval (v1): every 30 seconds.

## Security (MUST)
- Authenticate Socket.IO connections with JWT.
- Authorize room joins; do not allow cross-user room access.
- Do not emit notifications to users who are not the intended recipient (no broadcast).

## Noise control (MUST)
- Do not emit per-keystroke events.
- Notifications are driven by domain events and preference checks; no realtime pushes for suppressed types.

## Observability (MUST)
- Emit structured logs for realtime push failures without including sensitive content.
- Track push latency and failure counts per `docs/spec/04-user-flows/04.9-notifications.md#§4.9.16`.
