# Validation Rules (agent-ref)

## Purpose
Provide an execution-focused, canonical list of validation rules, constraints, and sanitization requirements used across domains. This file is optimized for fast retrieval by agents and implementers.

## Canonical Sources
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md`
- `docs/spec/12-errors/12.4-error-code-catalog.md`
- `docs/spec/09-api-standards/09.4-error-standards.md`
- `docs/spec/09-api-standards/09.3-response-standards.md`
- `docs/domains/auth/security.md`
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/documents/editor-capabilities.md`
- `docs/domains/files/feature-spec.md`
- `docs/domains/search/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`

## Domain Sources
- `docs/domains/auth/security.md`
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/tasks/feature-spec.md`
- `docs/domains/comments/feature-spec.md`
- `docs/domains/documents/editor-capabilities.md`
- `docs/domains/files/feature-spec.md`
- `docs/domains/search/feature-spec.md`
- `docs/domains/notifications/feature-spec.md`

## Scope
- Field-level validation rules for core entities
- Sanitization rules for user-provided content
- API validation envelopes and error mapping
- Guardrails for query params and payloads

## Required Rules / Contract

### Global validation standards
- All request validation failures return `400 VALIDATION_ERROR` with `error.details` per error envelope.
- Enum mismatches return `400 INVALID_ENUM_VALUE` or `400 VALIDATION_ERROR` (consistent policy required).
- JSON parsing failures return `400 INVALID_JSON`.
- Never leak stack traces or internal identifiers in error responses.

### Auth
- Email format must be valid (`INVALID_EMAIL`).
- Password policy: minimum 8 chars, mixed case, number, special (`PASSWORD_TOO_WEAK`).
- Verification/reset tokens: reject invalid (`TOKEN_INVALID`), expired (`TOKEN_EXPIRED`), reused (`TOKEN_ALREADY_USED`).

### Workspaces
- Workspace name length: 3–60 chars (validation error on violation).
- Description max: 280 chars.
- Workspace type immutable after creation in v1.
- Invitation accept requires email match (`EMAIL_MISMATCH`).

### Documents / Folders
- Folder nesting depth max: 10 levels.
- Folder delete blocked if non-empty (`FOLDER_NOT_EMPTY`).
- Folder moves must prevent cycles (`INVALID_PARENT`).
- Document submit requires non-empty content (`DOCUMENT_EMPTY`).
- Academic review requires note when requesting changes (`NOTE_REQUIRED`).

### Tasks
- Title: 1–200 chars (required).
- Description: plain text only; max 10,000 chars.
- Priority enum: `low|medium|high|urgent`.
- Status enum: `backlog|todo|in_progress|in_review|done`.
- Due date is date-only; recommended reject past dates (`INVALID_DATE`).
- Labels: max 10; each 1–30 chars; allowed `[a-zA-Z0-9-]` only (`INVALID_LABEL`).
- Assignee must be active workspace member (`INVALID_ASSIGNEE`).
- Status transitions must follow state machine (`INVALID_TRANSITION`).

### Comments
- Comment content required; empty content → `VALIDATION_ERROR`.
- Anchors must be valid JSONB; malformed → `INVALID_ANCHOR`.
- Mentions must reference active workspace members; invalid → `INVALID_MENTION`.
- Edit windows enforced by role; expired → `EDIT_WINDOW_EXPIRED`.

### Files
- MIME allowlist enforced (`INVALID_FILE_TYPE`).
- Size limits enforced (`FILE_TOO_LARGE`).
- Workspace storage limit enforced (`WORKSPACE_STORAGE_LIMIT_REACHED`).
- Attach only `ready` files (`FILE_NOT_READY`).
- Checksum mismatch → `CHECKSUM_MISMATCH`.

### Search
- Query required; empty query → `VALIDATION_ERROR`.
- Query length max 200 chars; overlong → `VALIDATION_ERROR`.
- Scope requires valid `workspaceId` for `scope=workspace`.

### Notifications
- Preferences reject unknown type keys (`VALIDATION_ERROR`).
- `recipient_id` scoping enforced on all reads/writes.

### Sanitization (MUST)
- Sanitize user-generated content on client and server using allowlist rules.
- Remove scripts, event handlers, and unsafe URLs (e.g., `javascript:`).
- Never store raw HTML as canonical content (store Tiptap/ProseMirror JSON and/or Yjs state).
- If unsupported nodes/marks are encountered, strip them and log a `content_sanitized` warning without logging content.

## Edge Cases / Failure Modes
- Validation errors must not leak resource existence or sensitive data.
- Non-member access must not bypass validation rules; return `403 NOT_WORKSPACE_MEMBER` for authenticated users.
- Client-side validation is insufficient; server-side validation is mandatory.

## Validation or Testing Notes
- Validate all enums at request boundaries.
- Ensure error envelopes include `requestId` and `details` for validation failures.
- Test sanitized payloads against XSS and unsafe URL vectors.
- Verify schema constraints at DB layer where applicable (unique, FK, and check constraints).

## Related Files / Domains
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/business-rules.md`
- `docs/agent-ref/data/enums.md`
- `docs/agent-ref/api/*-endpoints.md`


