# notifications/api-contracts

## Domain
Notifications REST API contracts (list, unread count, mark read, preferences), including pagination and error behavior.

## Canonical Sources
- `docs/spec/04-user-flows/04.9-notifications.md` — §4.9.14 API contracts (flow-level)
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes, pagination, errors
- `docs/spec/12-errors/12.4-error-code-catalog.md` — validation/error codes

## Included Topics
- List notifications + filters
- Unread count
- Mark read / mark all read
- Notification preferences read/write
- Error codes and access constraints

## API standards applied
- Auth required (JWT).
- Responses use `{ data, meta }` envelope.
- Pagination uses `page` + `pageSize`.

## Endpoints (authoritative summary)

### 1) Unread count
`GET /api/v1/notifications/unread-count`

Response:
- `200 OK`
```coloe/docs/domains/notifications/api-contracts.md#L1-220
{
  "data": { "unreadCount": 12 }
}
```

Errors:
- `401 UNAUTHORIZED`

---

### 2) List notifications
`GET /api/v1/notifications`

Query params:
- `page` (default 1)
- `pageSize` (default 25)
- `unreadOnly=true|false`
- `workspaceId=<uuid>` (optional)
- `types=task.assigned,document.mention` (optional)

Response:
- `200 OK`
```coloe/docs/domains/notifications/api-contracts.md#L1-220
{
  "data": {
    "items": [
      {
        "id": "notif-uuid",
        "type": "task.assigned",
        "workspaceId": "workspace-uuid",
        "title": "Task assigned to you",
        "body": "Implement login page",
        "url": "/w/workspace-uuid/tasks/task-uuid",
        "isRead": false,
        "createdAt": "2025-07-17T12:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { "page": 1, "pageSize": 25, "totalItems": 120, "totalPages": 5 }
  }
}
```

Authorization:
- Must filter by `recipient_id = currentUserId` only.
- `workspaceId` is a filter, not an auth gate.

Errors:
- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR` (bad params)

---

### 3) Mark a notification as read
`PATCH /api/v1/notifications/:id/read`

Request:
```coloe/docs/domains/notifications/api-contracts.md#L1-220
{ "isRead": true }
```

Response:
```coloe/docs/domains/notifications/api-contracts.md#L1-220
{
  "data": { "id": "notif-uuid", "isRead": true, "readAt": "2025-07-17T12:05:00Z" }
}
```

Errors:
- `401 UNAUTHORIZED`
- `403 FORBIDDEN` (attempt to modify others’ notifications)
- `404 NOT_FOUND` (if not owned by user)

---

### 4) Mark all as read
`PATCH /api/v1/notifications/mark-all-read`

Response:
```coloe/docs/domains/notifications/api-contracts.md#L1-220
{ "data": { "updatedCount": 42 } }
```

Errors:
- `401 UNAUTHORIZED`

---

### 5) Get notification preferences
`GET /api/v1/notification-preferences`

Response:
```coloe/docs/domains/notifications/api-contracts.md#L1-220
{
  "data": {
    "inApp": { "task.assigned": true, "document.mention": true },
    "email": { "task.assigned": true, "document.mention": true },
    "dailyDigestEnabled": false,
    "weeklyDigestEnabled": false
  }
}
```

Errors:
- `401 UNAUTHORIZED`

---

### 6) Update notification preferences
`PUT /api/v1/notification-preferences`

Request:
```coloe/docs/domains/notifications/api-contracts.md#L1-220
{
  "inApp": { "task.assigned": true, "workspace.announcement": false },
  "email": { "task.assigned": true, "workspace.announcement": false },
  "dailyDigestEnabled": true,
  "weeklyDigestEnabled": false
}
```

Errors:
- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR` (unknown type keys or invalid payload)

## Notes
- Notification queries must **never** allow access to other users’ records.
- Realtime delivery is documented in `realtime.md`; API contracts above are REST only.