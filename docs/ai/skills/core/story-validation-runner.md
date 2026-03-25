# Story Validation Runner

## Purpose
Validate that all tasks in a story meet their acceptance criteria and integrate correctly end-to-end.

## When to Use
- Story-level completion checks.
- Before marking a story as done or ready for release.

## Required Inputs / Context
- Story definition and acceptance criteria.
- List of child tasks and their validations.
- Relevant AGENTS.md and `docs/agent-ref/*` references.

## Read First
- `AGENTS.md`
- Module AGENTS for affected areas
- `docs/agent-ref/ops/ci-cd.md`

## Workflow
1. Enumerate all child tasks and their acceptance criteria.
2. Verify each task’s validation evidence (tests, screenshots, logs).
3. Run missing validations if possible.
4. Execute end-to-end story validation (cross-module flow).
5. Record evidence and gaps.

## Dangerous Mistakes
- Treating task completion as story completion without integration validation.
- Skipping cross-workspace access checks.
- Ignoring realtime or worker side effects.

## Validation Expectations
- Verify all child-task validations.
- Run end-to-end flow checks that match story acceptance.

## Escalation Conditions
- Any child task lacks validation evidence.
- Story requirements conflict with spec/agent-ref.

## Related Skills / References
- `core/project-validation-runner.md`
- `implementation/integration-test-writer.md`
- `docs/agent-ref/ops/release-readiness.md`
