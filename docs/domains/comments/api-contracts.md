# comments/api-contracts

## Domain
Comments API contracts.

## Canonical Sources
- `docs/spec/04-user-flows/04.8-commenting-mentions.md` — FL-007 API contracts
- `docs/spec/05-features/05.4-documents.md` — document comments endpoints
- `docs/spec/05-features/05.5-tasks.md` — task comments endpoints
- `docs/spec/12-errors/12.4-error-code-catalog.md` — error codes

## Included Topics
- Create comment
- List comments
- Edit/delete comment
- Resolve thread

## Endpoints
- `POST /api/v1/workspaces/:workspaceId/comments`
- `GET /api/v1/workspaces/:workspaceId/comments?targetType=document|task&targetId=...&status=open|resolved|all`
- `PATCH /api/v1/workspaces/:workspaceId/comments/:commentId`
  - errors: `403 EDIT_WINDOW_EXPIRED`, `403 FORBIDDEN`
- `DELETE /api/v1/workspaces/:workspaceId/comments/:commentId`
- `POST /api/v1/workspaces/:workspaceId/comment-threads/:threadId/resolve` (Manager+)

Create errors:
- `403 FORBIDDEN`
- `404 TARGET_NOT_FOUND`
- `400 VALIDATION_ERROR` (empty)
- `400 INVALID_ANCHOR`
- `400 INVALID_MENTION`
