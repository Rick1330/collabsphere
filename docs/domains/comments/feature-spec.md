# comments/feature-spec

## Domain
Comments feature spec.

## Canonical Sources
- `docs/spec/04-user-flows/04.8-commenting-mentions.md` — FL-007 Commenting + mentions
- `docs/spec/05-features/05.4-documents.md` — §5.4.6/7 document comments/mentions
- `docs/spec/05-features/05.5-tasks.md` — §5.5.6 task comments/mentions
- `docs/spec/08-data-model/08.7-comments-mentions.md` — comment_threads/comments/comment_mentions tables
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — comment realtime events
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md` — sanitization/XSS rules
- `docs/spec/12-errors/12.4-error-code-catalog.md` — EDIT_WINDOW_EXPIRED, INVALID_MENTION, INVALID_ANCHOR

## Included Topics
- Thread model
- Edit/delete rules
- Resolve/reopen
- Anchoring rules and degradation behavior
- Sanitization/XSS constraints

## Thread model
- `comment_threads` targets `document` or `task`.
- Threads can be `open` or `resolved`.
- Replies are comments within a thread.

## Edit/delete rules
- Only author can edit/delete.
- Edit window (canonical):
  - Viewer/Member: 15 min
  - Manager: 30 min
  - Admin: 1 hour
  - Owner: 1 hour
- After window, API returns `403 EDIT_WINDOW_EXPIRED`.

Deletion behavior:
- If parent comment deleted but replies exist, keep thread and show “Deleted comment” placeholder.

## Anchoring rules (documents)
- Anchored (inline) document comments are in scope for v1; `comment_threads.anchor` is populated for inline comments.
- Inline document comments store `comment_threads.anchor` JSONB (best-effort).
- If anchor becomes invalid after edits:
  - Thread remains accessible from sidebar/list.
  - UI shows “Original text changed” badge and falls back to nearest heading or top of document.
- API should return `400 INVALID_ANCHOR` only when the anchor payload is malformed (not when resolution fails later).

## Sanitization (MUST)
- Sanitize comment content on client and server using an allowlist.
- Remove scripts, event handlers, and unsafe URLs (e.g., `javascript:`).
- Store structured Tiptap/ProseMirror JSON; never store raw HTML.

## Resolve/reopen
- Resolve thread: Manager+
- Resolved threads hidden by default in UI with “Show resolved” toggle.
