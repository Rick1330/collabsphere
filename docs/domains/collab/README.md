# collab/README

## Domain
Realtime document collaboration stack: Tiptap editor integration, Yjs CRDT state, Hocuspocus collaboration server, awareness/presence, persistence hooks, read-only enforcement, and failure modes.

## Canonical Sources
- `docs/spec/10-realtime/10.1-overview.md` — Realtime systems; Hocuspocus responsibilities
- `docs/spec/10-realtime/10.2-hocuspocus-collaboration.md` — Hocuspocus/Yjs collaboration
- `docs/spec/10-realtime/10.3-socketio-app-events.md` — Socket.IO separation
- `docs/spec/05-features/05.4-documents.md` — §5.4 realtime collaboration rules
- `docs/spec/11-security/11.8-realtime-security.md` — realtime security requirements
- `docs/spec/06-nfrs/06.2-performance.md` — realtime latency targets
- `docs/spec/08-data-model/08.5-documents-submissions.md` — documents.content_yjs storage; plaintext derivation
- `docs/spec/15-testing/15.6-required-test-suites.md` — realtime/collab testing expectations

## Included Topics
- Collaboration endpoint and room naming (`doc:<documentId>`)
- JWT authentication and per-document authorization
- Hocuspocus hooks (`onLoadDocument`, `onStoreDocument`, connect/disconnect)
- Awareness/presence and cursor UI expectations
- Persistence strategy and derived plaintext indexing hooks
- Read-only enforcement rules (Viewer, locked/submitted/approved)
- Failure modes and degraded UX
- Testing strategy for multi-client collaboration

## Related domains
- `documents/` (metadata, hierarchy, locking/status; references collab for realtime)
- `security/` (baseline security rules; see quality)
- `search/` (plaintext derivation from Yjs state)
- `observability/` (realtime metrics/logging; see quality)
