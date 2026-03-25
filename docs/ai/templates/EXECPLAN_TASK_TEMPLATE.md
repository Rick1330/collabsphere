# ExecPlan Task Template

## Metadata
| Field | Value |
|---|---|
| Task ID | `<TaskID>` |
| Title | `<Task Title>` |
| Story | `<StoryID>: <Story Title>` |
| Priority | `<P0|P1|P2|P3>` |
| Tier | `tier:S` |
| Estimated Effort | `<L|XL>` |
| Status | `<draft|ready|in_progress|blocked|done>` |
| Owner | `<name or team>` |
| Created | `<YYYY-MM-DD>` |
| Updated | `<YYYY-MM-DD>` |

## Labels
- `tier:S`
- `type:execplan`
- `router:<api|web|collab|worker|db|ui|shared|ops>`
- `review:<elevated|critical|release>`
- Additional: `<label>`

## Why ExecPlan Is Required
- `<reason: complexity, risk, cross-module, collab/security/isolation, etc.>`

## ExecPlan Location
- Plan file: `<path/to/execplan.md>`
- Standard: `.agent/PLANS.md`
- Note: implementation details live in the plan, not in this task file.

## Chain
- Position: `<#>`
- Needs: `<TaskID list or none>`
- Blocks: `<TaskID list or none>`

## AGENTS.md Directive
- Read `AGENTS.md` and module-specific AGENTS for the target area.

## Canonical References
- `<docs/agent-ref/...>`
- `<docs/spec/...>` (only if needed for canonical clarity)

## Required Milestones
- `<Milestone 1: outcome + acceptance>`
- `<Milestone 2: outcome + acceptance>`
- `<Milestone 3: outcome + acceptance>`

## Validation Requirements
- Milestone-level validation commands and expected outcomes must be in the ExecPlan.
- Final validation must prove behavior, not just build success.

## Handoff & Escalation
- Handoff must include progress status, validation evidence, and open risks.
- Escalate if plan conflicts with `docs/spec/` or unresolved policy exists.

## Done When
- [ ] ExecPlan exists and matches `.agent/PLANS.md` requirements.
- [ ] Required milestones completed with validation evidence.
- [ ] Final validation executed or explicitly waived with rationale.
- [ ] Handoff completed with outcomes and remaining risks.

## References
- `AGENTS.md`
- `.agent/PLANS.md`
- `docs/agent-ref/*`
