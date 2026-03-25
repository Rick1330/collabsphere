# BullMQ Worker Implementation

## Purpose
Implement background jobs with idempotence and safe side-effect boundaries.

## When to Use
- Adding or modifying worker jobs (notifications, exports, cleanup).

## Required Inputs / Context
- Job contract and relevant event definitions.

## Read First
- `apps/worker/AGENTS.md`
- `docs/agent-ref/events/notification-dispatch.md`
- `docs/agent-ref/events/domain-events.md`

## Workflow
1. Identify event source and idempotency key.
2. Implement job handler with retries/backoff.
3. Enforce workspace scoping for all reads/writes.
4. Record outcomes and errors with canonical codes/logging.

## Dangerous Mistakes
- Non-idempotent job handlers.
- Cross-workspace processing without scoping.
- Direct side effects bypassing event-driven flow.

## Validation Expectations
- Unit tests for idempotency and retry behavior.
- Verify no duplicate notifications or exports on retries.

## Escalation Conditions
- Any job that needs new event types or schema changes.

## Related Skills / References
- `implementation/integration-test-writer.md`
- `guardrail/workspace-isolation.md`
