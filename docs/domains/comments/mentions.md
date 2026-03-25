# comments/mentions

## Domain
Mentions (`@user`) behavior, constraints, and notification fanout.

## Canonical Sources
- `docs/spec/04-user-flows/04.8-commenting-mentions.md` — FL-007 mentions spec
- `docs/spec/05-features/05.4-documents.md` — document comments/mentions context
- `docs/spec/05-features/05.5-tasks.md` — task comments/mentions context
- `docs/spec/04-user-flows/04.9-notifications.md` — notification types and recipient rules
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `INVALID_MENTION`
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — comment events (`comment.created`)

## Included Topics
- Mention UX and tokenization
- Mention persistence and dedupe
- Notification fanout rules
- Privacy and workspace isolation

## Mention UX (MUST)
- Typing `@` opens autocomplete of **workspace members only**.
- Selecting a user inserts a mention token (not plain text) with `userId` + label.
- Autocomplete must never reveal non-workspace users.

## Persistence (MUST)
- Backend extracts mention tokens and persists into `comment_mentions`.
- Enforce unique constraint per `(commentId, mentionedUserId)` to dedupe.
- If a mention references a non-member, API rejects with `400 INVALID_MENTION`.

## Notification fanout (MUST)
- When a comment is created, notify each mentioned user **once**.
- Notification types must align with canonical notification types:
  - Document comment mention → `document.mention`
  - Task comment mention → `task.mention`
- Mentions are dispatched via the event pipeline (comment created → notification service).

## Eventing (MUST)
- `comment.created` domain event must include `mentions[]` in payload per spec.
- Notification service consumes `comment.created` and dispatches mention notifications.

## Privacy & isolation (MUST)
- Mentions must be scoped to the comment’s workspace.
- Do not log mention content; log only user IDs and counts where needed.