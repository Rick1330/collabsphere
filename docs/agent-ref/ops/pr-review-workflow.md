# PR Review Workflow (agent-ref)

## Purpose

Define the expected branch, PR, review, and merge workflow for CollabSphere delivery and maintenance work.

## Canonical Sources

- `AGENTS.md`
- `docs/spec/14-devops/14.5-ci-pipeline.md`
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/agent-ref/ops/ci-cd.md`

## Core Rules

- `main` is the only normal merge target.
- Every PR should map to one issue.
- Every issue should have one active working branch at a time.
- Validation evidence is required in the PR description or linked issue/handoff.

## Branch Naming

Recommended patterns:

- `feature/<issue-number>-<slug>`
- `validate/<issue-number>-<slug>`
- `docs/<issue-number>-<slug>`
- `fix/<issue-number>-<slug>`
- `hotfix/<issue-number>-<slug>`

## PR State Mapping

Recommended issue-state transitions:

- branch created and work started -> `status:in_progress`
- draft PR opened -> keep `status:in_progress`
- PR marked ready for review -> `status:in_review`
- review requests changes -> return to `status:in_progress`
- PR merged -> `status:done`
- PR closed without merge -> move to `status:ready`, `status:triage`, or `status:cancelled` based on reason

## Required PR Content

Every PR should include:

- linked issue
- concise summary
- files or surfaces changed
- validation commands and outcomes
- risks, waivers, or follow-ups
- handoff note if the issue requires one

Use `.github/pull_request_template.md`.

## Review Sources

Review input may come from:

- human reviewers
- local IDE review agents
- Devin Review
- CodeScene

These are review inputs, not automatic merge authority.

## Review Tier Labeling

Every executable issue should carry exactly one review-tier label:

- `review:standard`
- `review:elevated`
- `review:critical`

The review router reads linked issue labels and applies the highest required review tier to the PR for visibility and enforcement.
Its sticky PR comment should show both configured integrations and the review activity actually detected on the current PR.

## Review Resolution Rules

For each meaningful review comment:

- apply the suggested fix
- reject it with a concrete reason
- or defer it into a follow-up issue if valid but out of scope

After review-driven changes:

- re-run affected validation
- update the PR summary if behavior changed
- update the handoff if risks or follow-ups changed

## Merge Rules

Do not merge until:

- required CI checks pass
- review state is acceptable for the issue risk level
- validation evidence is present
- required handoff details are captured

## Elevated and Critical Work

For `review:elevated` or `review:critical` work:

- read the linked issue carefully before reviewing
- review against the relevant spec and agent-ref docs, not just the diff
- treat security, isolation, and realtime correctness as first-class review concerns

## Related Files

- `.github/pull_request_template.md`
- `.github/CODEOWNERS`
- `docs/agent-ref/ops/github-issue-lifecycle.md`
- `docs/agent-ref/ops/handoff-format.md`
- `docs/agent-ref/ops/branch-protection.md`
- `docs/agent-ref/ops/review-automation.md`
