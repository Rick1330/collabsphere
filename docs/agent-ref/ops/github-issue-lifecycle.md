# GitHub Issue Lifecycle (agent-ref)

## Purpose

Define the operational lifecycle for CollabSphere GitHub issues, including delivery work, validation gates, and maintenance work.

## Canonical Sources

- `AGENTS.md`
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/ai/PROJECT_TEMPLATE_V2.md`
- `docs/ai/STORY_TEMPLATE_V2.md`
- `docs/ai/templates/TASK_KERNEL_TEMPLATE.md`
- `docs/ai/templates/STORY_VALIDATION_TEMPLATE.md`
- `docs/ai/templates/PROJECT_VALIDATION_TEMPLATE.md`

## Scope

- issue types and lanes
- lifecycle statuses
- parent-child completion rules
- queue progression rules
- when issues close

## Source of Truth

- GitHub issues are the operational source of truth for issue state, comments, PR links, and handoffs.
- `.github/queue/` is the structural source of truth for planned delivery order and hierarchy.
- `docs/spec/` remains canonical for product and system behavior.

## Issue Classes

### Delivery lane

- `type:epic`
- `type:story`
- `type:task`
- `type:validation`

### Maintenance lane

- `type:bug`
- `type:dependency`
- `type:docs`
- `type:ops`
- `type:incident`
- `type:investigation`
- `type:chore`

## Lane Labels

- `lane:delivery` for planned project/story/task execution
- `lane:maintenance` for non-roadmap work
- `lane:hotfix` for urgent work that preempts normal execution

## Status Model

### Projects

- `status:backlog`
- `status:planned`
- `status:in_progress`
- `status:blocked`
- `status:done`
- `status:cancelled`

### Stories

- `status:backlog`
- `status:planned`
- `status:in_progress`
- `status:blocked`
- `status:done`
- `status:cancelled`

### Implementation tasks

- `status:ready`
- `status:in_progress`
- `status:in_review`
- `status:blocked`
- `status:done`
- `status:cancelled`

### Validation issues

- `status:ready`
- `status:in_progress`
- `status:blocked`
- `status:done`
- `status:cancelled`

### Maintenance work

- `status:triage`
- `status:ready`
- `status:in_progress`
- `status:in_review`
- `status:blocked`
- `status:done`
- `status:cancelled`

## Delivery Queue Rules

- queue order comes from `.github/queue/`
- the queue controller should promote the next eligible issue, not simply the next issue number
- dependencies and blocked states can prevent promotion
- story and project validation are explicit gates, not implied completion

## Completion Rules

### Implementation task complete

An implementation task is complete only when:

- the scoped work is done
- validation was run or explicitly waived with reason
- the PR is merged or the issue is otherwise explicitly resolved
- required handoff content is posted
- the issue is labeled `status:done`

### Story complete

A story is complete only when:

- all implementation child tasks are `status:done`
- the story validation issue runs
- the story validation issue passes and becomes `status:done`
- the story issue is closed and labeled `status:done`

### Project complete

A project is complete only when:

- all stories are `status:done`
- the project validation issue runs
- the project validation issue passes and becomes `status:done`
- the project issue is closed and labeled `status:done`

## Failed Validation

If story or project validation fails:

- do not close the parent issue
- do not mark the validation issue `status:done`
- create or reopen the exact follow-up implementation work needed
- keep the parent `status:blocked` or `status:in_progress` as appropriate

## Maintenance Work Rules

- default new maintenance work to `status:triage`
- assign `source:*` and `severity:*` where relevant
- use `lane:hotfix` for urgent release-blocking or production work
- incident closure should require both the fix and the post-incident summary or postmortem

## Related Files

- `docs/agent-ref/ops/pr-review-workflow.md`
- `docs/agent-ref/ops/handoff-format.md`
- `docs/agent-ref/ops/branch-protection.md`
- `docs/agent-ref/ops/ci-cd.md`
