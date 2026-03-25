# AGENTS.md

## Purpose
Local rules for BullMQ workers (notifications, exports, cleanup, reminders).

## Scope
`apps/worker` jobs, queues, and background task orchestration.

## Must Follow
- Jobs must be idempotent; use `eventId` or stable keys for dedupe.
- Respect retry/backoff policies and surface failures with canonical error codes/logs.
- All job data must remain workspace-scoped; enforce isolation in queries.
- Notification dispatch is preference-aware and event-driven.
- Export jobs are async; provide status and short-lived download URLs.
- Cleanup jobs must follow retention rules (soft delete windows).

## Never Do
- Process cross-workspace data without explicit scoping.
- Emit per-keystroke notifications or activity.
- Recompute document content from REST; use stored Yjs/derived plaintext.

## Tests / Validation
- Add job-level unit tests for idempotency and error handling.
- Validate retries do not create duplicate notifications or exports.
- Verify retention cleanup respects soft-delete windows.

## References
- `docs/agent-ref/events/domain-events.md`
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/events/activity-rules.md`
- `docs/agent-ref/data/notification-schema.md`
- `docs/agent-ref/data/export-schema.md`
- `docs/agent-ref/data/file-schema.md`
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/ops/local-dev.md`
