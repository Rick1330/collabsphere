# collab/yjs

## Domain
Yjs CRDT model and storage implications.

## Canonical Sources
- `docs/spec/05-features/` — FL-005 CRDT storage strategy
- `docs/spec/08-data-model/` — documents.content_yjs and derived plaintext/search
- `docs/spec/06-nfrs/` — offline editing requirement

## Included Topics
- Canonical storage format
- Offline editing and merge

## Storage format
- Canonical document content is stored as Yjs encoded binary update/state.
- Persisted in Postgres as `BYTEA` (`documents.content_yjs`).

## Offline editing
- Client may continue editing while offline.
- On reconnect, Yjs merges updates deterministically.

## Plaintext derivation
- Maintain `documents.content_plaintext` for search.
- Do not decode CRDT state on each search query.
