# collab/tiptap

## Domain
Tiptap editor integration requirements relevant to collaboration.

## Canonical Sources
- `docs/spec/05-features/` — §5.4 editor and collaboration stack

## Included Topics
- Tiptap as editor surface
- Binding to Yjs (`y-prosemirror`) and collaboration UI elements

## Requirements
- Tiptap is the editor surface; ProseMirror-based.
- Bind editor operations to Yjs via `y-prosemirror`.
- Editor UI must display collaboration state:
  - connected/reconnecting/offline banner
  - saved/saving indicators (persistence is periodic)
  - presence avatars and optional cursors

Sanitization and supported formatting are documented under `docs/domains/documents/editor-capabilities.md`.
