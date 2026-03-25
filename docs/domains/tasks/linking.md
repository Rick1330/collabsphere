# tasks/linking

## Domain
Document ↔ Task linking (create task from document selection + deep links + anchors).

## Canonical Sources
- `docs/spec/05-features/05.6-document-task-linking.md` — §5.6 Document ↔ Task Linking
- `docs/spec/08-data-model/08.6-tasks-columns-links.md` — task_document_links table
- `docs/spec/12-errors/12.4-error-code-catalog.md` — `INVALID_ANCHOR`, `WORKSPACE_MISMATCH`, `DOCUMENT_NOT_FOUND`, `TASK_NOT_FOUND`, `LINK_NOT_FOUND`
- `docs/spec/13-observability/13.3-structured-logging.md` — logging/privacy constraints

## Included Topics
- Permissions to create links
- Anchor schema and resolution algorithm
- API contract extensions for creating tasks with source links
- Error codes and degraded behaviors
- Cross-workspace constraints
- Deletion semantics (document/task)

## Permissions
To create task from document selection:
- Must have task create permission (Member+)
- Must have permission to view the document
- Allowed even if doc is locked/submitted/approved (does not modify doc content)

## Anchor reliability principle
Anchors are best-effort and may degrade over time:
- Attempt to locate selected quote in current plaintext.
- If not found, open the document and show banner “Original text moved or changed” and fall back to nearest heading or document top.
- Return `INVALID_ANCHOR` when anchor payload is malformed or cannot be parsed.

## Anchor schema (JSONB)
Canonical fields include:
- quote (truncate to max 280 chars)
- quoteHash (sha256)
- createdFrom/createdTo (best-effort positions)
- createdAtVersionHint (optional)
- headingPath (optional breadcrumb)

## API integration
- Create task supports optional `source` payload with `documentId` + `anchor`.
- Backend creates `task_document_links` record.
- Link detail endpoint returns anchor for deep-link navigation.

## Cross-workspace constraint (MUST)
- Linking MUST occur only within the same workspace. If `document.workspace_id != task.workspace_id`, reject with `WORKSPACE_MISMATCH`.

## Invalid target behavior (MUST)
- If target document does not exist or is not visible to the caller, return `DOCUMENT_NOT_FOUND`.
- If task is not visible or does not exist, return `TASK_NOT_FOUND`.

## Invalid anchor behavior (MUST)
- If anchor cannot be resolved, continue navigation with degraded behavior as above and surface a non-fatal warning; APIs that require a resolvable anchor should return `INVALID_ANCHOR`.

## Deletion outcomes (MUST)
- When a document is deleted or becomes inaccessible, the link SHOULD remain but navigation will open the document (or 404 page) with a banner; background cleanup MAY soft-delete links per retention policy.
- When a task is deleted, associated links MUST be soft-deleted or marked `orphaned`; navigation from document should hide the link.

## Notifications (MUST)
- Do NOT generate notifications for link creation or removal by default (avoid noise). Mentions and task assignments still notify per their domains.

## Observability (MUST)
- Metrics: `task.link.created.count`, `task.created_from_document.count`, `document_link.open.count`, `document_link.anchor_resolved.rate` (optional).
- Logs: `task_link_created`, `task_link_denied_permission`, `task_link_anchor_invalid`, `task_link_workspace_mismatch`.
- Privacy: do not log full quote text; log `quoteHash` + length only.

## Error codes (canonical)
- `INVALID_ANCHOR`, `WORKSPACE_MISMATCH`, `DOCUMENT_NOT_FOUND`, `TASK_NOT_FOUND`, `LINK_NOT_FOUND`.
