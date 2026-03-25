# Task Kernel Executor

## Purpose
Execute a task kernel safely and consistently within CollabSphere’s architecture and guardrails.

## When to Use
- A task kernel is provided (explicit steps, scope, acceptance).
- Small to medium changes that do not require an ExecPlan.

## Required Inputs / Context
- Task kernel text (scope, acceptance, constraints).
- Applicable AGENTS.md (root + module).
- Relevant `docs/agent-ref/*` references.

## Read First
- `AGENTS.md`
- Module AGENTS for the target area (e.g., `apps/api/AGENTS.md`).
- `docs/agent-ref/` files linked by the task kernel.

## Workflow
1. Parse the kernel: identify scope, files, acceptance, validations, and guardrails.
2. Load the correct AGENTS.md for the target module(s).
3. Load the exact `docs/agent-ref/*` sources referenced by the kernel.
4. Confirm boundaries: no extra files, no policy invention, and **one dominant execution surface**.
5. Validate file scope: prefer exact paths; allow narrow frontend wildcards only when filenames are truly unknown and scoped to a single folder with notes.
6. Implement changes directly (do not stop at planning).
7. Run the required validations (or record why not), including negative-path checks when relevant.
8. Update the kernel handoff with what changed and evidence of validation.

## Dangerous Mistakes
- Ignoring module AGENTS or `docs/agent-ref` constraints.
- Expanding scope beyond the kernel without logging it.
- Returning document CRDT/Yjs content via REST.
- Skipping workspace scoping or RBAC checks.

## Validation Expectations
- Run all kernel-specified tests.
- Include negative-path checks for security/isolation-sensitive tasks (denials, non-enumeration, rate limits, invalid transitions).
- If tests cannot run, record the exact reason and expected outcomes.

## Escalation Conditions
- Task is ambiguous, multi-hour, or touches collab/security/isolation core → convert to ExecPlan.
- Spec/domain conflict or missing policy → log in `docs/audit/agents-open-questions.md` and pause.

## Related Skills / References
- `core/execplan-executor.md`
- `guardrail/workspace-isolation.md`
- `.agent/PLANS.md`
- `AGENTS.md`
