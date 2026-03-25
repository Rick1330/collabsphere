# documents/editor-capabilities

## Domain
Editor feature requirements and content safety rules.

## Canonical Sources
- `docs/spec/05-features/` — §5.4.5 editor capabilities; content safety
- `docs/spec/11-security/` — sanitization and XSS prevention

## Included Topics
- Required formatting features
- Optional features by priority
- Sanitization rules and storage constraints

## Required capabilities (v1)
- Paragraphs
- Headings H1–H6
- Bold/italic/underline/strikethrough
- Bullet and ordered lists
- Blockquote
- Inline code + code blocks
- Links
- Undo/redo (local)
- Paste handling (sanitize)

Optional (P1/P2)
- Tables (P1 if feasible)
- Images (P2; depends on files)
- Slash commands (P2)
- Outline / TOC panel (P2)

## Content storage constraints
- Canonical content is structured (ProseMirror/Tiptap doc) and/or CRDT state.
- Never store raw HTML as canonical.

## Sanitization
- Sanitize pasted HTML on client (allowlist only).
- Sanitize on server as defense-in-depth using the same allowlist.
- Remove all scripts, event handlers, and unsafe URLs (e.g., `javascript:`).
- Never store raw HTML as canonical content; store structured Tiptap/ProseMirror JSON and/or Yjs state only.
- If unsupported nodes/marks are encountered, strip them and log a `content_sanitized` warning without leaking user content.
