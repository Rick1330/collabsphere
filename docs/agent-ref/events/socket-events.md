# Socket Events (agent-ref)

## Purpose
Provide an execution-focused reference for Socket.IO application events, rooms, auth requirements, and payload expectations used by CollabSphere.

## Canonical Sources
- `docs/spec/10-realtime/10.3-socketio-app-events.md`
- `docs/spec/18-appendices/18.1-domain-event-catalog.md`
- `docs/domains/notifications/realtime.md`
- `docs/domains/tasks/api-contracts.md`
- `docs/domains/activity-audit/activity-feed.md`
- `docs/domains/activity-audit/events.md`
- `docs/domains/notifications/events.md`
- `docs/spec/11-security/11.8-realtime-security.md`

## Domain Sources
- `docs/domains/notifications/realtime.md`
- `docs/domains/tasks/api-contracts.md`
- `docs/domains/activity-audit/activity-feed.md`
- `docs/domains/activity-audit/events.md`
- `docs/domains/notifications/events.md`

## Scope
- Socket.IO endpoint and auth
- Room naming and authorization
- Server → client event names
- Payload expectations (notification, task, activity)
- Reconnect behavior and client obligations

## Required Rules / Contract

### Endpoint & Namespace
- WebSocket endpoint: `wss://api.collabsphere.io/socket`
- Namespace: default `/`

### Authentication (MUST)
- Client connects with JWT:
  - `auth: { token: "<JWT>" }`
- Server validates token and attaches `userId` and `globalRole` to socket context.
- Reject connection if token invalid/expired or account deactivated.

### Rooms (MUST)
- `user:<userId>` — per-user notification delivery.
  - User may only join their own room.
- `workspace:<workspaceId>` — workspace-scoped realtime updates.
  - Requires active workspace membership.
- Optional, scoped rooms (when enabled):
  - `document:<documentId>` — comment streams scoped to a document.
  - `task:<taskId>` — comment streams scoped to a task.
- Clients must rejoin rooms on reconnect.

### Server → Client Events (authoritative)
- Notifications:
  - `notification:new`
  - `notification:count`
  - Optional: `notification:read`, `notification:batch_read`
- Tasks (workspace room):
  - `task:created`
  - `task:updated`
  - `task:moved`
  - `task:deleted`
  - `task:assigned`
- Comments (workspace room; optional document/task rooms):
  - `comment:thread_created`
  - `comment:created`
  - `comment:updated`
  - `comment:deleted`
  - `comment:thread_resolved`
  - `comment:thread_reopened`
- Activity (workspace room):
  - `activity:new` (if implemented as live updates)

### Payload Expectations

#### `notification:new`
Payload (canonical fields):
- `id`, `type`, `workspaceId`, `title`, `body`, `url`
- `actor`: `{ id, fullName, avatarUrl }` (nullable)
- `resource`: `{ type, id }`
- `isRead`, `createdAt`

#### Task events (lightweight)
- Include minimal task identifiers and changed fields.
- Clients may refetch full task details if needed.

#### Comment events (lightweight)
- Always include: `threadId`, `targetType`, `targetId`.
- Include `commentId` for `comment:created|updated|deleted`.
- Keep payloads minimal; clients may refetch full thread/comment details.

#### Activity events (lightweight)
- Include `eventKey`, `summary`, `actor`, `resource`, `createdAt`.
- No per-keystroke activity updates.

### Noise Control (MUST)
- Do NOT emit per-keystroke events.
- Do NOT emit notifications for document-task linking by default.
- Avoid noisy file upload notifications unless explicitly enabled.

## Edge Cases / Failure Modes
- Reconnect: client must rejoin rooms; server must re-authorize.
- Unauthorized room join: deny and do not leak room data.
- Socket outages: clients fall back to polling:
  - Notifications: every 30s.
  - Task board/list: every 10–15s.
  - Activity feed: every 15–30s.

## Validation or Testing Notes
- Verify room authorization on join and rejoin.
- Confirm events only reach authorized recipients.
- Ensure payloads exclude sensitive content.
- Test reconnect behavior and room rejoin logic.

## Related Files / Domains
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/activity-rules.md`
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/api/notification-endpoints.md`


