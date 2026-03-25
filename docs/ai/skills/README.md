# Skills — Canonical Source Layer

## Purpose
This directory contains canonical skill-pack source documents for CollabSphere. These files define execution workflows and guardrails for common and high-risk tasks. They are the source layer for future packaging into tool-specific skills.

## Authority Model
- `docs/spec/` is canonical.
- `docs/domains/` is engineering-oriented.
- `docs/agent-ref/` is execution-oriented.
- If conflict exists, `docs/spec/` wins.

## Structure
- `core/` — execution control skills (task kernels, ExecPlans, validation runners)
- `guardrail/` — safety and architecture invariants
- `implementation/` — common build workflows

## Usage
- Read the relevant AGENTS.md file first.
- Follow the required section order in each skill.
- Use `.agent/PLANS.md` when a task requires an ExecPlan.

## Related References
- `AGENTS.md`
- `apps/*/AGENTS.md`
- `packages/*/AGENTS.md`
- `.agent/PLANS.md`
- `docs/agent-ref/*`
