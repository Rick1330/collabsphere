# comments/data-model

## Domain
Comments persistence model.

## Canonical Sources
- `docs/spec/08-data-model/08.7-comments-mentions.md` — comment_threads, comments, comment_mentions
- `docs/spec/04-user-flows/04.8-commenting-mentions.md` — comment anchoring, mentions, edge cases
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md` — sanitization/XSS constraints
- `docs/spec/12-errors/12.4-error-code-catalog.md` — INVALID_MENTION, INVALID_ANCHOR

## Included Topics
- Thread schema and target polymorphism
- Comment content storage and deletion strategy
- Anchoring fields and degradation behavior
- Mention join table and dedupe constraints
- Workspace isolation and permissions constraints

## comment_threads
- workspace-scoped (`workspace_id` required on all rows)
- `target_type`: document|task
- `target_id`: UUID of target entity (enforced in service)
- `anchor` JSONB optional (document inline); malformed anchors must be rejected with `INVALID_ANCHOR`
- `status`: open|resolved
- `resolved_by`, `resolved_at`
- `created_at`, `updated_at`

## comments
- workspace-scoped
- belongs to `thread_id`
- `content` JSONB (Tiptap)
- deletion strategy: `is_deleted` + placeholder content (retain replies)
- snapshot fields for author display (name/avatar)
- `created_at`, `updated_at`
- Content must be sanitized on client and server; never store raw HTML

## comment_mentions
- workspace-scoped
- links comment → mentioned user
- unique per (comment_id, mentioned_user_id) to dedupe
- references must be valid workspace members; otherwise reject with `INVALID_MENTION`
