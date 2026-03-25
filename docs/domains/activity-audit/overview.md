# activity-audit/overview

## Domain
Activity feed vs audit log: definitions, separation rules, and core constraints.

## Canonical Sources
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8 Activity Feed & Audit Logging
- `docs/spec/11-security/11.10-audit-logging.md` — audit security principles
- `docs/spec/13-observability/13.3-structured-logging.md` — structured logging constraints
- `docs/spec/18-appendices/18.1-domain-event-catalog.md` — canonical event envelope

## Included Topics
- Difference between user-facing activity feed and admin-facing audit log
- Separation rules (immutability, retention, scope)
- Event bus usage and mapping constraints
- Security and privacy guarantees

## Separation (MUST)
- **Activity Feed** MUST be user-facing, workspace-scoped, and optimized for collaboration UX.
- **Audit Log** MUST be admin-facing, immutable, and optimized for security/compliance.
- Security-sensitive actions MUST go to the audit log; activity feed may include UX summaries without sensitive details.
- Activity feed entries MAY be coalesced/updated for relevance; audit log entries MUST be append-only.
- Activity feed retention MUST be shorter (e.g., 180 days); audit log retention MUST be longer (365 days default).
- Events MUST be emitted via an internal event bus to ensure decoupling between services.

## Core constraints (MUST)
- No per-keystroke activity events; document edits must be coalesced or omitted per spec.
- Audit log must include IP address and user agent for auth/security events.
- Never log secrets, tokens, presigned URLs, or raw search queries in either feed.
