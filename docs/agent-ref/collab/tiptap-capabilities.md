# Tiptap Capabilities (agent-ref)

## Purpose
Provide an execution-focused reference for required editor capabilities, content safety rules, and storage constraints for Tiptap/ProseMirror in CollabSphere.

## Canonical Sources
- `docs/domains/documents/editor-capabilities.md`
- `docs/domains/collab/overview.md`
- `docs/spec/05-features/05.4-documents.md` — editor capabilities
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md` — sanitization/XSS rules
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md` — realtime editing boundary

## Domain Sources
- `docs/domains/documents/editor-capabilities.md`
- `docs/domains/collab/overview.md`

## Scope
- Required editor formatting capabilities (v1)
- Optional capabilities (P1/P2)
- Content storage constraints (structured JSON + Yjs)
- Sanitization and XSS prevention
- Collaboration boundary (REST metadata only)

## Required Rules / Contract

### Required capabilities (v1)
- Paragraphs
- Headings H1–H6
- Bold / Italic / Underline / Strikethrough
- Bullet and ordered lists
- Blockquote
- Inline code + code blocks
- Links
- Undo/redo (local)
- Paste handling with sanitization

### Optional capabilities (P1/P2)
- Tables (P1 if feasible)
- Images (P2; depends on files)
- Slash commands (P2)
- Outline / TOC panel (P2)

### Content storage constraints
- Canonical content is structured Tiptap/ProseMirror JSON and/or Yjs CRDT state.
- Never store raw HTML as canonical content.
- REST MUST NOT deliver editable CRDT/Yjs document content (metadata only).

### Sanitization (MUST)
- Sanitize pasted HTML on client (allowlist only).
- Sanitize on server as defense-in-depth using the same allowlist.
- Remove all scripts, event handlers, and unsafe URLs (e.g., `javascript:`).
- If unsupported nodes/marks are encountered, strip them and log a `content_sanitized` warning without leaking content.

## Edge Cases / Failure Modes
- Unsupported nodes/marks from pasted content must be dropped (not persisted).
- Collaboration server down → editor opens read-only with banner; no REST editing fallback.
- Large pasted content must not bypass sanitization or size limits.

## Validation or Testing Notes
- Verify sanitization on both client and server paths.
- Ensure no raw HTML persists in storage.
- Confirm required formatting features are enabled in editor schema.
- Validate read-only behavior when document is locked or workspace archived.

## Related Files / Domains
- `docs/agent-ref/collab/read-only-rules.md`
- `docs/agent-ref/collab/yjs-state-model.md`
- `docs/agent-ref/collab/hocuspocus-hooks.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/security-rules.md`


