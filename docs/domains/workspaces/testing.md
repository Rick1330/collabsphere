# workspaces/testing

## Domain
Testing requirements for workspace management and isolation.

## Canonical Sources
- `docs/spec/05-features/` — §5.2 testing
- `docs/spec/15-testing/` — required suites
- `docs/spec/11-security/` — isolation testing requirements

## Included Topics
- Unit tests for role rules
- Integration tests for workspace CRUD and membership
- E2E flows for creation and invite acceptance

## Unit tests
- Max assignable role rules
- Ownership transfer logic
- Archived workspace write guards

## Integration tests
- Create workspace initializes:
  - workspace row
  - owner membership
  - workspace settings
- Update workspace requires Admin+
- Archive/unarchive toggles and write blocking
- Role change immediately enforced
- Removing member invalidates access

## E2E (Playwright)
- Workspace creation wizard → lands in workspace
- Invite member → accept invite → member appears
- Role changes update UI restrictions
- Archive workspace → edit actions disabled

## Isolation tests (must exist)
- For each resource type, verify non-member cannot access by guessing IDs.
