# comments/testing

## Domain
Comments and mentions testing.

## Canonical Sources
- `docs/spec/04-user-flows/04.8-commenting-mentions.md` — FL-007 edge cases and realtime events
- `docs/spec/05-features/05.4-documents.md` — document comments/mentions context
- `docs/spec/05-features/05.5-tasks.md` — task comments/mentions context
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md` — sanitization/XSS constraints
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `INVALID_MENTION`, `INVALID_ANCHOR`, `EDIT_WINDOW_EXPIRED`
- `docs/spec/15-testing/15.6-required-test-suites.md` — required comment suites

## Included Topics
- Integration tests for persistence and permissions
- Mention notification tests
- Edit window enforcement
- Anchor degradation and sanitization tests
- Realtime event coverage

## Unit
- Mention token parsing → dedupe per user
- Invalid mention → `400 INVALID_MENTION`
- Invalid anchor payload → `400 INVALID_ANCHOR`
- Edit window enforcement per role
- Sanitization strips scripts/unsafe URLs

## Integration
- Thread creation + replies
- Mention parsing; `INVALID_MENTION` for non-member
- Edit window enforcement per role
- Resolve thread requires Manager+
- Realtime events emitted on create/update/delete/resolve
- Anchor invalidation after edits shows degraded behavior
- Deleted parent comment shows placeholder and preserves replies

## E2E
- Create comment on document; appears in second browser
- Mention user; notification appears
- Resolve thread; thread moves to resolved state UI
- Anchor becomes invalid after edits → thread still accessible with “Original text changed” badge
- XSS attempt in comment content is sanitized (no script execution)
