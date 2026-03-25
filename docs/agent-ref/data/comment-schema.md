# Comment Schema (agent-ref)

## Purpose
Define the persistent schema, constraints, and lifecycle rules for comments, comment threads, and mentions.

## Canonical Sources
- `docs/domains/comments/data-model.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/comments/mentions.md`
- `docs/spec/08-data-model/08.7-comments-mentions.md`
- `docs/spec/04-user-flows/04.8-commenting-mentions.md`
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/comments/data-model.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/comments/mentions.md`

## Scope
- `comment_threads`, `comments`, `comment_mentions` tables
- Anchoring fields and validation constraints
- Workspace scoping and permissions assumptions
- Sanitization requirements and deletion behavior

## Required Rules / Contract

### Table: `comment_threads`
- `workspace_id` (UUID, required; workspace-scoped)
- `target_type`: `document|task`
- `target_id`: UUID (polymorphic; validate existence in service)
- `anchor`: JSONB optional (document inline anchors)
- `status`: `open|resolved`
- `resolved_by`, `resolved_at`
- `created_at`, `updated_at`

**Constraints**
- All rows must include `workspace_id`.
- `target_type` + `target_id` must belong to the same workspace.
- Malformed `anchor` payloads must be rejected with `INVALID_ANCHOR`.
- Anchored document comments are **in scope for v1**:
  - Inline threads require `anchor`.
  - General document comments store `anchor = null`.

### Table: `comments`
- `workspace_id` (UUID, required)
- `thread_id` (FK → `comment_threads`)
- `content` JSONB (Tiptap/ProseMirror)
- `is_deleted` boolean + placeholder content for deleted parent comments
- Snapshot fields for author display (name/avatar)
- `created_at`, `updated_at`

**Constraints**
- Never store raw HTML; only structured JSON.
- Content must be sanitized on client and server (allowlist only).

### Table: `comment_mentions`
- `workspace_id` (UUID, required)
- `comment_id` (FK → `comments`)
- `mentioned_user_id` (FK → `users`)
- Unique constraint on `(comment_id, mentioned_user_id)` for dedupe

**Constraints**
- Mentioned user must be an active workspace member; otherwise reject with `INVALID_MENTION`.

## Edge Cases / Failure Modes
- Anchor resolves later failure: thread remains accessible; UI shows “Original text changed” banner and falls back to nearest heading or top.
- Deleting a parent comment with replies: retain thread and show placeholder (“Deleted comment”).
- Cross-workspace target mismatch must be rejected (authorization + validation).

## Validation or Testing Notes
- Validate `content` is non-empty and sanitized.
- Enforce edit windows by role at service layer.
- Reject malformed anchors with `INVALID_ANCHOR`; do not reject anchors solely for later resolution failure.
- Ensure mention dedupe and membership validation.

## Related Files / Domains
- `docs/agent-ref/api/comment-endpoints.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/events/domain-events.md`


