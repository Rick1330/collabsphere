## Canonical Sources
- `docs/spec/05-features/05.7-files-attachments.md` — §5.7.6.2 Attachments (polymorphic)
- `docs/spec/08-data-model/08.11-exports-background-jobs.md` — attachment joins

## Included Topics
- Linking files to documents, tasks, and comments
- Attachment-level permissions and isolation
- Behavioral constraints on attaching `status != ready` files

## Linking rules
- Attachments MUST be polymorphic and support `document`, `task`, and `comment` (v1.1) targets.
- A file MUST NOT be attached to a target in a different workspace.
- The `attachment` record MUST include `workspace_id` for isolation enforcement.

## Constraints
- **Ready state**: MUST prevent attaching files where `status != ready`.
- **Soft delete**: When a target is deleted, associated attachment records MUST be soft-deleted.
- **Access check**: Attachment visibility MUST respect the user's permission on the target entity.
