# AGENTS.md

## Purpose
Local rules for shared types, constants, and cross-service contracts.

## Scope
`packages/shared` types, enums, event contracts, and shared validation schemas.

## Must Follow
- Shared enums and constants must align with canonical agent-ref enums.
- Event payload types must align with domain event and socket event catalogs.
- Centralize error code definitions; avoid divergent copies.
- Shared contracts are the single source for cross-service types (do not fork).

## Never Do
- Duplicate enums or error codes in multiple packages.
- Introduce types that conflict with API/data contracts.
- Add event names not present in the canonical event catalogs.

## Tests / Validation
- Update shared typings when API/data/event contracts change.
- Add type-level tests or lint rules when introducing new shared contracts.

## References
- `docs/agent-ref/data/enums.md`
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/rules/error-codes.md`
