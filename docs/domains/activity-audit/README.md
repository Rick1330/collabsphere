## Domain
Activity feed and audit logging for CollabSphere, including user-visible activity streams and immutable admin-facing audit trails.

## Canonical Sources
- `docs/spec/05-features/` (activity feed and auditing features)
- `docs/spec/08-data-model/` (activity and audit event tables)
- `docs/spec/11-security/` (audit and compliance requirements)
- `docs/spec/13-observability/` (event logging, metrics, retention)

## Included Topics
- End-user activity feed behavior and event types
- System-of-record audit log and its guarantees
- Data model and APIs for querying activity and audit entries
- Security and access control for audit logs

## Separation of concerns (MUST)
- Activity feed: user-facing, workspace-scoped, mutable/coalesced entries, shorter retention, optimized for UX.
- Audit log: immutable, admin-only, security/compliance focused, longer retention, tamper-evident.
- Do not blend responsibilities: security events MUST go to audit log; user-centric summaries MAY appear in activity feed without sensitive details.

## Related domains
- `documents/`, `tasks/`, `comments/` — domains that emit activity/audit events
- `admin/` — admin access to audit logs
- `quality/` — observability and retention policies for events
