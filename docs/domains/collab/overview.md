# collab/overview

## Domain
Realtime collaboration overview and boundaries.

## Canonical Sources
- `docs/spec/10-realtime/` — overview; system separation
- `docs/spec/07-architecture/` — service topology

## Included Topics
- Two realtime systems separation
- Responsibilities of Hocuspocus vs Socket.IO
- Explicit non-goals for REST content delivery
- Activity/event coalescing principles

## Two realtime systems
1. **Document collaboration realtime**: Hocuspocus (Yjs sync + awareness + persistence).
2. **Application realtime events**: Socket.IO (tasks/notifications/activity updates).

This domain focuses on Hocuspocus + Yjs collaboration.

## REST vs Realtime (MUST)
- REST APIs MUST NOT deliver editable CRDT/Yjs document content. REST is limited to metadata, versions/exports, and non-editable representations.
- All editing and live content sync MUST occur via Hocuspocus/Yjs according to §10-realtime.

## Activity granularity (MUST)
- No per-keystroke activity events. Activity feed entries MUST be coalesced into meaningful actions (e.g., "edited document" within a time window), not every operational transform.
- No per-keystroke persistence guarantees. Persistence cadence follows `collab/persistence.md` and canonical guidance; clients MUST tolerate eventual consistency.
