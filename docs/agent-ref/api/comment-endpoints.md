# Comment Endpoints (agent-ref)

## Purpose
Provide an execution-focused reference for comment and comment-thread REST endpoints, including routes, auth/role requirements, payload expectations, error codes, and invariants.

## Canonical Sources
- `docs/domains/comments/api-contracts.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/comments/data-model.md`
- `docs/domains/comments/mentions.md`
- `docs/spec/04-user-flows/04.8-commenting-mentions.md`
- `docs/spec/05-features/05.4-documents.md`
- `docs/spec/05-features/05.5-tasks.md`
- `docs/spec/10-realtime/10.3-socketio-app-events.md`
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/comments/api-contracts.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/comments/data-model.md`
- `docs/domains/comments/mentions.md`

## Scope
- Create, list, edit, delete comments
- Resolve comment threads
- Anchoring rules for document comments
- Mentions validation and dedupe
- Required error codes and invariants
- Realtime event implications

## Required Rules / Contract

### Base
- Base path: `/api/v1/workspaces/:workspaceId`
- Auth required (JWT).
- Workspace membership required for all endpoints.
- Workspace archived blocks writes: return `403 WORKSPACE_ARCHIVED_READONLY`.

### Endpoints (authoritative)

#### Create comment
`POST /api/v1/workspaces/:workspaceId/comments`

Request (summary):
- `targetType`: `document|task`
- `targetId`: UUID
- `content`: Tiptap/ProseMirror JSON
- Optional `anchor` JSONB for document inline comments
- Inline (anchored) document comments are **in scope for v1**:
  - Anchored threads require `anchor`.
  - General document comments omit `anchor` (null).

Errors:
- `403 FORBIDDEN`
- `404 TARGET_NOT_FOUND`
- `400 VALIDATION_ERROR` (empty content)
- `400 INVALID_ANCHOR`
- `400 INVALID_MENTION`

#### List comments
`GET /api/v1/workspaces/:workspaceId/comments?targetType=document|task&targetId=...&status=open|resolved|all`

Notes:
- Must be permission-aware for the target entity.
- Returns threads and comments per canonical response schema.

#### Edit comment
`PATCH /api/v1/workspaces/:workspaceId/comments/:commentId`

Rules:
- Only author can edit.
- Edit window (canonical):
  - Viewer/Member: 15 min
  - Manager: 30 min
  - Admin: 1 hour
  - Owner: 1 hour

Errors:
- `403 EDIT_WINDOW_EXPIRED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`

#### Delete comment
`DELETE /api/v1/workspaces/:workspaceId/comments/:commentId`

Rules:
- Only author can delete.
- If replies exist, preserve thread and show placeholder (“Deleted comment”).

#### Resolve thread
`POST /api/v1/workspaces/:workspaceId/comment-threads/:threadId/resolve`

Rules:
- Manager+ only.
- Resolved threads hidden by default in UI.

### Invariants
- Comments are workspace-scoped.
- `targetType` and `targetId` must belong to the same workspace.
- Anchors are best-effort; malformed anchors are rejected (`INVALID_ANCHOR`).
- Mentions must refer to active workspace members; invalid mentions rejected (`INVALID_MENTION`).

### Required Errors (non-exhaustive)
- `NOT_WORKSPACE_MEMBER`
- `WORKSPACE_ARCHIVED_READONLY`
- `TARGET_NOT_FOUND`
- `INVALID_ANCHOR`
- `INVALID_MENTION`
- `EDIT_WINDOW_EXPIRED`
- `VALIDATION_ERROR`

### Related Events
- Domain events (canonical): `comment.thread_created`, `comment.created`, `comment.updated`, `comment.deleted`, `comment.thread_resolved`, `comment.thread_reopened`.
- Socket.IO should broadcast comment events to workspace room per realtime rules.

## Edge Cases / Failure Modes
- Anchor resolution failure after document edits should degrade gracefully (banner + fallback to nearest heading/top).
- Deleting parent comment with replies retains thread and placeholder.
- Mention dedupe: a user mentioned multiple times in one comment receives one mention notification.

## Validation or Testing Notes
- Validate `content` is sanitized; never store raw HTML.
- Ensure author-only edit/delete and enforce edit window.
- Ensure malformed anchor payloads return `INVALID_ANCHOR` (not on later resolution failure).
- Verify mention validation and dedupe in `comment_mentions`.

## Related Files / Domains
- `docs/agent-ref/data/comment-schema.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/socket-events.md`


