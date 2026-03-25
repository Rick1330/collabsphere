# templates/testing

## Domain
Template system testing requirements.

## Canonical Sources
- `docs/spec/05-features/` — §5.3.13 testing
- `docs/spec/15-testing/` — integration/E2E expectations

## Included Topics
- Unit tests for schema validation and conversion
- Integration tests for transactional workspace init
- E2E tests for template-driven creation

## Unit tests
- Template schema validation
- Markdown → Tiptap JSON conversion
- Category/type constraint validation
- Idempotency handling

## Integration tests
- Workspace creation applies template and creates expected counts (folders/docs/columns/settings)
- Document creation from template seeds CRDT state and plaintext
- Template preview endpoint returns structure preview
- Category mismatch rejected

## E2E
- Create workspace using academic template results in expected structure
- Create document from template opens with expected headings
- Preview modal shows expected summary
