# Workspace Isolation Guardrail

## Purpose
Prevent cross-workspace data leakage and enforce strict isolation across all layers.

## When to Use
- Any API, DB, worker, search, notification, or activity work touching workspace-scoped data.

## Required Inputs / Context
- Target tables/entities and access paths.
- Applicable AGENTS.md files.

## Read First
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/security-rules.md`
- `AGENTS.md`

## Workflow
1. Identify all workspace-owned entities involved.
2. Ensure every query filters by `workspace_id` and active membership.
3. Verify no resource-id-only access patterns (IDOR risk).
4. Confirm search, notifications, and activity are scoped to authorized workspaces.
5. Validate `403 NOT_WORKSPACE_MEMBER` for authenticated non-members.

## Dangerous Mistakes
- Using IDs without workspace scoping.
- Joining across workspaces without explicit constraints.
- Returning 404 to authenticated non-members (must be 403).

## Validation Expectations
- Add tests for cross-workspace denial.
- Verify membership checks in REST and realtime joins.
- Include explicit negative-path validation steps (A cannot access B) in task-level validation.

## Escalation Conditions
- Any uncertainty about scoping rules or access paths.

## Related Skills / References
- `guardrail/auth-session-security.md`
- `implementation/integration-test-writer.md`
- `docs/agent-ref/api/*-endpoints.md`
