# documents/testing

## Domain
Documents testing requirements.

## Canonical Sources
- `docs/spec/05-features/` — §5.4 testing requirements
- `docs/spec/15-testing/` — docs test suites and E2E coverage

## Included Topics
- Unit tests for hierarchy and lifecycle validation
- Integration tests for metadata endpoints and persistence
- E2E tests including multi-client collaboration (via collab)

## Unit tests
- Hierarchy move validation (cycle prevention)
- Lock/unlock permission checks
- Version snapshot trigger logic
- Export format validation

## Integration tests
- Create doc seeds CRDT state and plaintext
- Tree endpoint returns correct nested structure
- Lock prevents non-allowed edits (server-side enforcement in collab)
- Restore creates `before_restore` snapshot and updates content

## E2E (Playwright)
- Create folder + document + reorder via drag/drop
- Open doc in two browsers → realtime editing works (see collab/testing)
- Lock doc from one user → other becomes read-only
- Create version → restore → content changes
- Export to PDF/Markdown → download works

## Academic workflow E2E
- Submit doc → student cannot edit
- Supervisor requests changes/approves with required note behavior
