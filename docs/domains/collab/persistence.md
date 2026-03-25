# collab/persistence

## Domain
Persistence of collaborative document state.

## Canonical Sources
- `docs/spec/10-realtime/` — persistence hooks
- `docs/spec/05-features/` — persistence timing guidance
- `docs/spec/08-data-model/` — documents table fields

## Included Topics
- Persist cadence expectations
- Postgres storage fields
- Derived plaintext update strategy

## Persist cadence
Canonical guidance:
- Persist periodically (every ~2–5s) OR on idle OR on disconnect.
- Persisting is best-effort; do not block collaboration on transient DB failures.
- No per-keystroke persistence: storage updates MUST be coalesced per the cadence; activity feeds MUST NOT rely on low-level persistence hooks for per-keystroke events.

## DB writes
On store:
- update `documents.content_yjs`
- update `documents.updated_at` and `updated_by`
- update derived `content_plaintext` (either synchronously or via async job)

## Plaintext derivation
- Required for search indexing.
- Prefer async/background job or on persistence hook to keep reasonably fresh.
