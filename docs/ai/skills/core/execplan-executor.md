# ExecPlan Executor

## Purpose
Execute complex work through a living ExecPlan that is compliant with `.agent/PLANS.md`.

## When to Use
- `tier:S` or `type:execplan` work.
- Multi-session tasks.
- Risky architectural changes.
- Anything touching collab/security/isolation core.

## Required Inputs / Context
- ExecPlan document (must match `.agent/PLANS.md`).
- Relevant AGENTS.md files for impacted modules.
- Required `docs/agent-ref/*` references.

## Read First
- `.agent/PLANS.md`
- `AGENTS.md`
- Module AGENTS in scope
- `docs/agent-ref/` files referenced by the plan

## Workflow
1. Validate the ExecPlan contains all required sections.
2. Check plan vs canonical docs; if conflict, update plan to match `docs/spec/`.
3. Execute milestones in order; update Progress continuously.
4. Log decisions and surprises as they happen.
5. Perform milestone-level validations and final validation.
6. Update Outcomes & Retrospective with what shipped and what remains.

## Dangerous Mistakes
- Treating the plan as static (it must be living).
- Skipping milestone validation.
- Failing to record decisions or surprises.
- Implementing behavior not supported by spec/agent-ref.

## Validation Expectations
- Each milestone has explicit validation commands and expected outcomes.
- Final validation confirms behavior, not just build success.

## Escalation Conditions
- Plan conflicts with spec/domain: pause and reconcile.
- New high-risk scope discovered: update plan and notify stakeholders.

## Related Skills / References
- `core/task-kernel-executor.md`
- `.agent/PLANS.md`
- `guardrail/collab-hocuspocus.md`
- `guardrail/workspace-isolation.md`
