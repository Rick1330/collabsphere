# activity-audit/data-model

## Domain
Activity feed and audit log data model (tables, indexes, and constraints).

## Canonical Sources
- `docs/spec/05-features/05.8-activity-audit.md` — §5.8.7 Data Model (activity_events, audit_log)
- `docs/spec/08-data-model/08.9-activity-audit.md` — table schemas and indexes
- `docs/spec/11-security/11.10-audit-logging.md` — immutability and access constraints
- `docs/spec/13-observability/13.3-structured-logging.md` — logging/privacy constraints

## Included Topics
- `activity_events` table schema and indexes
- `audit_log` table schema and indexes
- Workspace scoping and access constraints
- Retention and immutability requirements

## Table: `activity_events` (authoritative)
Purpose: User-facing, workspace-scoped activity feed entries.

Key fields:
- `id` UUID PK
- `workspace_id` UUID FK
- `actor_id` UUID NULL (system events allowed)
- `event_key` varchar(80)
- `summary` varchar(255)
- `resource_type` varchar(40) NULL
- `resource_id` UUID NULL
- `metadata` JSONB
- `created_at` timestamptz

Indexes (canonical):
- `(workspace_id, created_at DESC)`
- `(workspace_id, event_key, created_at DESC)`
- `(workspace_id, actor_id, created_at DESC)` (optional)

Rules (MUST):
- Workspace-scoped queries only.
- Entries may be coalesced/updated for relevance.
- Retention shorter than audit log (e.g., 180 days).

## Table: `audit_log` (authoritative)
Purpose: Admin-facing, immutable security/compliance log.

Key fields:
- `id` UUID PK
- `request_id` varchar(64)
- `severity` enum: `info|warn|error`
- `action_key` varchar(120)
- `actor_id` UUID NULL
- `actor_email` varchar(255) NULL
- `actor_global_role` enum: `USER|ADMIN` NULL
- `workspace_id` UUID NULL
- `target_type` varchar(40) NULL
- `target_id` UUID NULL
- `ip_address` varchar(64) NULL
- `user_agent` text NULL
- `metadata` JSONB
- `created_at` timestamptz

Indexes (canonical):
- `(created_at DESC)`
- `(action_key, created_at DESC)`
- `(actor_email, created_at DESC)`
- `(workspace_id, created_at DESC)`

Rules (MUST):
- Append-only and immutable; no edit/delete endpoints.
- Admin-only access.
- Auth/security events must include IP and user agent.
- Retention longer than activity feed (default 365 days).

## Privacy & safety (MUST)
- Never store secrets, tokens, presigned URLs, or raw search queries in either table.
- Use redaction/hashing where needed in `metadata`.

## Retention & cleanup
- Activity feed: shorter retention; coalescing allowed.
- Audit log: longer retention; expunge only via retention job per spec.

## Traceability notes
- Event keys must align with `docs/spec/18-appendices/18.1-domain-event-catalog.md`.
- Any new event types must be added to canonical spec first.