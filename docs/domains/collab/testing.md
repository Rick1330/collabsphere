# collab/testing

## Domain
Realtime collaboration testing.

## Canonical Sources
- `docs/spec/15-testing/` — required E2E coverage for realtime
- `docs/spec/04-user-flows/` — FL-005

## Included Topics
- Multi-client correctness checks
- Read-only enforcement checks
- Reconnect/offline behavior checks

## Integration tests
- Hocuspocus auth rejects invalid JWT.
- Workspace membership required to join `doc:<documentId>`.
- Viewer can connect but cannot publish updates.
- Locked/submitted/approved docs reject writes for disallowed roles.

## E2E
- Open same document in two browser contexts; edits propagate.
- Disconnect one client network; local edits retained; on reconnect, merged.
- Downgrade role while editing; subsequent writes rejected and UI shows banner.
