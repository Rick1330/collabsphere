# Data Reference (agent-ref)

## Purpose
Execution-focused index of data schemas, enums, and lifecycle rules for agents and implementers.

## Canonical Sources
- `docs/spec/08-data-model/*`
- `docs/spec/05-features/*` (data model sections)
- `docs/spec/12-errors/12.4-error-code-catalog.md`

## Domain Sources
- `docs/domains/*/data-model.md`
- `docs/domains/*/feature-spec.md`
- `docs/domains/*/lifecycle.md`
- `docs/domains/*/versioning-export.md`

## Scope
- Persistent schemas and constraints
- Workspace scoping rules
- Retention/lifecycle expectations
- Indexes that affect correctness/perf
- Export job tracking

## Files
- `enums.md` — canonical enums used across domains
- `auth-schema.md` — users + auth tokens
- `workspace-schema.md` — workspaces, memberships, settings, invitations
- `document-schema.md` — folders/docs/versions/submissions + CRDT fields
- `task-schema.md` — tasks, columns, links, retention
- `comment-schema.md` — threads/comments/mentions
- `notification-schema.md` — notifications + preferences + retention
- `template-schema.md` — templates + schema/versioning
- `export-schema.md` — export jobs tracking + retention
- `file-schema.md` — files + attachments + lifecycle constraints

## Required Rules / Contract
- All workspace-owned entities MUST include `workspace_id` and be scoped on reads/writes.
- Retention windows and lifecycle rules are authoritative; do not shorten.
- Do not store raw HTML for editor/comment content.

## Edge Cases / Failure Modes
- Cross-workspace joins or link table writes must be rejected (workspace isolation).
- Soft-deleted records must not appear in normal queries; retention cleanup must preserve active references.
- Derived indexes (e.g., `search_vector`, `content_plaintext`) must not bypass workspace scoping.

## Validation / Testing Notes
- Validate FK consistency and workspace scoping on all link tables.
- Enforce enum values at validation and persistence layers.

## Related Files / Domains
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/api/*-endpoints.md`
