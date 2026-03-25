# comments/README

## Domain
Comments domain: threaded discussions on documents and tasks, resolving/reopening threads, time-limited edit windows by role, mentions and notification fanout, and realtime comment updates.

## Canonical Sources
- `docs/spec/04-user-flows/04.8-commenting-mentions.md` — FL-007 Commenting + mentions
- `docs/spec/05-features/05.4-documents.md` — §5.4.6/7 document comments/mentions
- `docs/spec/05-features/05.5-tasks.md` — §5.5.6 task comments/mentions
- `docs/spec/08-data-model/08.7-comments-mentions.md` — comment_threads/comments/comment_mentions tables
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — comment realtime events (Socket.IO patterns)
- `docs/spec/12-errors/12.4-error-code-catalog.md` — EDIT_WINDOW_EXPIRED, INVALID_MENTION, INVALID_ANCHOR
- `docs/spec/15-testing/15.6-required-test-suites.md` — comments testing requirements

## Included Topics
- Comment surfaces (document inline/general; task thread)
- Threading and resolve state
- Permissions and edit windows by role
- Mentions parsing rules and notification dedupe
- Realtime events for comment creation/update/delete
- Data model tables and API contracts

## Related domains
- `documents/` and `tasks/` (comment targets)
- `notifications/` (mention notifications)
- `workspaces/` (permissions)
- `activity-audit/` (activity events for comment actions)
