# Project Validation Runner

## Purpose
Validate project-level readiness beyond story completion, focusing on system-wide acceptance and operational gates.

## When to Use
- Before declaring a project phase or release complete.
- Prior to skill-pack generation or AGENTS integration milestones.

## Required Inputs / Context
- Project success metrics and exit criteria.
- Story completion evidence.
- Release readiness requirements.

## Read First
- `docs/agent-ref/ops/release-readiness.md`
- `docs/agent-ref/ops/ci-cd.md`
- `AGENTS.md`

## Workflow
1. Review project success metrics and exit criteria.
2. Verify all stories and critical tasks are validated.
3. Run cross-system checks (API, web, collab, worker).
4. Confirm observability, error codes, and security guardrails.
5. Record final readiness verdict and gaps.

## Dangerous Mistakes
- Declaring project complete without operational gates.
- Skipping collab and isolation checks.

## Validation Expectations
- Ensure CI-level validations pass or record why not.
- Confirm critical guardrails and invariants.

## Escalation Conditions
- Any exit criteria unmet.
- Unresolved security/isolation or collab failures.

## Related Skills / References
- `core/story-validation-runner.md`
- `guardrail/workspace-isolation.md`
- `guardrail/collab-hocuspocus.md`
