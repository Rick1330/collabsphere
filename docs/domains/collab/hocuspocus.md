# collab/hocuspocus

## Domain
Hocuspocus collaboration server behavior.

## Canonical Sources
- `docs/spec/10-realtime/` — Hocuspocus responsibilities, endpoint, auth, hooks
- `docs/spec/05-features/` — collaboration rules
- `docs/spec/11-security/` — realtime security

## Included Topics
- WebSocket endpoint and room naming
- AuthN/AuthZ
- Hooks and persistence expectations

## Endpoint and rooms
- WebSocket endpoint: `wss://api.collabsphere.io/collaboration`
- Room naming: `doc:<documentId>`

## Authentication
- JWT provided via connection params or Authorization header.
- Validate signature/expiry and account active/non-deleted.

## Authorization
On connect:
- load document metadata (workspaceId, status, lock, deleted)
- validate workspace membership
- compute effective permission:
  - Viewer can connect read-only
  - Member+ can edit only if document is editable by status/lock/workspace policy

## Hooks
- `onLoadDocument`: fetch `documents.content_yjs` and return.
- `onStoreDocument`: persist updated Yjs state to `documents.content_yjs` and update `updated_at/updated_by`.
- `onConnect`/`onDisconnect`: presence tracking (optional) and emit internal events `document.collaboration_joined/left`.
