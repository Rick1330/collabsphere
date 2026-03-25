# documents/README

## Domain
Documents domain: hierarchical organization (folders + documents), metadata CRUD, editor requirements, locking, version history/restore, export, and academic submission/review integration. Deep realtime collaboration mechanics are owned by `collab/`.

## Canonical Sources
- `docs/spec/04-user-flows/04.6-document-collaboration.md` — FL-005 documents + realtime collaboration
- `docs/spec/04-user-flows/04.11-academic-submission-review.md` — FL-010 academic submission/review; FL-011 version history; FL-012 export
- `docs/spec/05-features/05.4-documents.md` — §5.4 Documents
- `docs/spec/08-data-model/08.5-documents-submissions.md` — folders/documents/versions/submissions tables
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md` — collaboration overview and document metadata realtime events
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation and RBAC
- `docs/spec/11-security/11.5-input-validation-output-sanitization.md` — sanitization
- `docs/spec/12-errors/12.4-error-code-catalog.md` — document/folder workflow errors
- `docs/spec/15-testing/15.6-required-test-suites.md` — documents testing requirements

## Included Topics
- Folder/document hierarchy rules (depth, ordering, cycle prevention)
- Document editor feature requirements (formatting + sanitization)
- Document lifecycle: lock/unlock, statuses (academic), archived workspace overrides
- Version snapshots + restore rules
- Export job flow
- Document REST APIs (metadata/tree/versions/export)
- Data model tables and constraints

## Related domains
- `collab/` (Tiptap/Yjs/Hocuspocus, persistence hooks, read-only enforcement)
- `comments/` (document comments)
- `tasks/` (doc↔task linking)
- `search/` (documents plaintext indexing and FTS)
- `files/` (attachments in/around documents; v1.1)
- `activity-audit/` (document lifecycle events)
