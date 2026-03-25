# files/api-contracts

## Domain
Files API contracts (upload intent, complete, list, download, delete, attachments).

## Canonical Sources
- `docs/spec/05-features/05.7-files-attachments.md` — §5.7.9 API Contracts
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes
- `docs/spec/11-security/11.9-file-security.md` — download security + TTL
- `docs/spec/09-api-standards/09.1-rest-api-design.md` — envelopes/pagination

## Included Topics
- Presigned upload intent + completion
- List files and download URLs
- Attachments create + list
- Error codes and authorization rules

## API standards applied
- Auth required (JWT).
- Responses use `{ data, meta }` envelope.
- Pagination uses `page` + `pageSize`.

## Endpoints (authoritative summary)

### 1) Create upload intent (presigned URL)
`POST /api/v1/workspaces/:workspaceId/files/upload-intent`

Request:
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "originalFilename": "diagram.png",
  "contentType": "image/png",
  "sizeBytes": 523112,
  "checksumSha256": "optional-sha256-hex"
}
```

Response (201):
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "data": {
    "file": {
      "id": "file-uuid",
      "status": "pending",
      "originalFilename": "diagram.png",
      "contentType": "image/png",
      "sizeBytes": 523112
    },
    "upload": {
      "method": "PUT",
      "url": "https://storage...presigned-url...",
      "headers": {
        "Content-Type": "image/png"
      },
      "expiresAt": "2025-07-17T13:00:00Z"
    }
  }
}
```

Errors:
- `403 FORBIDDEN` (Viewer)
- `400 INVALID_FILE_TYPE`
- `400 FILE_TOO_LARGE`
- `400 WORKSPACE_STORAGE_LIMIT_REACHED`
- `404 WORKSPACE_NOT_FOUND`

---

### 2) Confirm upload completion
`POST /api/v1/workspaces/:workspaceId/files/:fileId/complete`

Request:
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "checksumSha256": "optional-sha256-hex"
}
```

Response (200):
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "data": {
    "file": {
      "id": "file-uuid",
      "status": "ready",
      "downloadUrl": "https://api.../download?token=..."
    }
  }
}
```

Errors:
- `400 UPLOAD_NOT_FOUND_IN_STORAGE`
- `400 CHECKSUM_MISMATCH`
- `403 FORBIDDEN`
- `404 FILE_NOT_FOUND`

Notes:
- Must be idempotent if called twice; second call returns ready.

---

### 3) List files
`GET /api/v1/workspaces/:workspaceId/files`

Query params:
- `page`, `pageSize`
- `type=image/png,application/pdf` (optional)
- `uploadedBy=uuid` (optional)
- `search=diagram` (optional)

Response (200):
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "data": {
    "items": [
      {
        "id": "file-uuid",
        "originalFilename": "diagram.png",
        "contentType": "image/png",
        "sizeBytes": 523112,
        "status": "ready",
        "uploadedBy": { "id": "u1", "fullName": "Jane Doe" },
        "createdAt": "2025-07-17T12:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": { "page": 1, "pageSize": 25, "totalItems": 120, "totalPages": 5 }
  }
}
```

Errors:
- `403 NOT_WORKSPACE_MEMBER`
- `404 WORKSPACE_NOT_FOUND`

---

### 4) Download file (presigned GET)
`GET /api/v1/workspaces/:workspaceId/files/:fileId/download`

Response (200):
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "data": {
    "downloadUrl": "https://storage...presigned-get-url...",
    "expiresAt": "2025-07-17T12:05:00Z"
  }
}
```

Errors:
- `403 FORBIDDEN`
- `404 FILE_NOT_FOUND`
- `400 FILE_NOT_READY`

Notes:
- Must re-check membership and workspace scoping at access time.
- TTL must be short (1–5 minutes).

---

### 5) Delete file (soft delete)
`DELETE /api/v1/workspaces/:workspaceId/files/:fileId`

Role:
- Manager+ for any file
- Member for own uploaded files

Response (200):
```coloe/docs/domains/files/api-contracts.md#L1-260
{ "data": { "message": "File deleted." } }
```

Errors:
- `403 FORBIDDEN`
- `404 FILE_NOT_FOUND`

Side effects:
- Soft-delete or mark attachments referencing the file as missing (policy choice).

---

### 6) Attach file to target
`POST /api/v1/workspaces/:workspaceId/attachments`

Request:
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "fileId": "file-uuid",
  "targetType": "task",
  "targetId": "task-uuid"
}
```

Response (201):
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "data": {
    "attachment": {
      "id": "att-uuid",
      "fileId": "file-uuid",
      "targetType": "task",
      "targetId": "task-uuid",
      "createdAt": "2025-07-17T12:10:00Z"
    }
  }
}
```

Errors:
- `400 FILE_NOT_READY`
- `404 FILE_NOT_FOUND`
- `404 TARGET_NOT_FOUND`
- `403 FORBIDDEN`
- `400 WORKSPACE_MISMATCH`
- `409 ATTACHMENT_EXISTS`

---

### 7) List attachments for a target
`GET /api/v1/workspaces/:workspaceId/attachments?targetType=task&targetId=task-uuid`

Response (200):
```coloe/docs/domains/files/api-contracts.md#L1-260
{
  "data": {
    "items": [
      {
        "id": "att-uuid",
        "file": {
          "id": "file-uuid",
          "originalFilename": "diagram.png",
          "contentType": "image/png",
          "sizeBytes": 523112
        },
        "createdAt": "2025-07-17T12:10:00Z"
      }
    ]
  }
}
```

Errors:
- `403 NOT_WORKSPACE_MEMBER`
- `404 TARGET_NOT_FOUND`

## Access-control notes
- All file and attachment queries MUST filter by `workspace_id`.
- File download MUST re-check membership and ACLs at access time.
- Viewer role is read-only; upload/attach must return `403 FORBIDDEN`.
