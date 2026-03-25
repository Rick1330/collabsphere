## Domain
Files, storage, and attachments for CollabSphere, including upload flows, storage architecture, lifecycle management, and attachments to domain entities.

## Canonical Sources
- `docs/spec/04-user-flows/04.1-flow-catalog.md` — FL-012 file upload/attachment flows
- `docs/spec/05-features/05.7-files-attachments.md` — §5.7 Files & Attachments
- `docs/spec/08-data-model/08.1-overview.md` — file/blob/attachment tables
- `docs/spec/11-security/11.9-file-security.md` — file access control and security constraints
- `docs/spec/12-errors/12.4-error-code-catalog.md` — file-related error codes
- `docs/spec/15-testing/15.6-required-test-suites.md` — file and upload testing requirements

## Included Topics
- End-user file upload and download behavior
- Storage architecture, buckets/containers, and keying strategy
- File lifecycle (upload, ready, deleted, garbage collection)
- Attachment model linking files to documents, tasks, and comments
- File-related APIs, data model, security rules, and testing

## Related domains
- `documents/` — document attachments
- `tasks/` — task attachments
- `comments/` — comment attachments
- `activity-audit/` — audit of file-related actions
- `quality/` — NFRs, security baselines, and observability for file handling
