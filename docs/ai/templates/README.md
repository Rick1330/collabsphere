# Execution Templates — Canonical Layer

## Purpose
This directory contains the canonical execution templates used to create real task artifacts for CollabSphere. These templates standardize metadata, routing, validation, and handoff expectations for AI agents and human contributors.

## Authority Model
- `docs/spec/` is canonical.
- `docs/domains/` is engineering-oriented.
- `docs/agent-ref/` is execution-oriented.
- `AGENTS.md` hierarchy defines repo/module guardrails.
- `.agent/PLANS.md` defines ExecPlan standards.

## Usage
- Choose the template that matches the task type and tier.
- Fill all required placeholders (`<...>`).
- Keep task artifacts concise; implementation detail lives in code or ExecPlans.
- Always include validation commands or record why they were not run.

## Templates
- `TASK_KERNEL_TEMPLATE.md` — standard implementation task.
- `EXECPLAN_TASK_TEMPLATE.md` — tasks requiring ExecPlan (`tier:S` / `type:execplan`).
- `STORY_VALIDATION_TEMPLATE.md` — story-level completion gate.
- `PROJECT_VALIDATION_TEMPLATE.md` — project-level completion gate.
- `REVIEW_TASK_TEMPLATE.md` — review-only tasks.
- `HOTFIX_TASK_TEMPLATE.md` — urgent production/staging fixes.

## Related References
- `AGENTS.md`
- `.agent/PLANS.md`
- `docs/agent-ref/*`
- `docs/ai/skills/*`
