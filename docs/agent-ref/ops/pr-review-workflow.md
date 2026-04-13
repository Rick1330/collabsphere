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
- Merge claims should be based on live checks and unresolved current-head review threads, not stale report text.

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
- concise markdown only; no malformed literal `\n`, broken checklists, or pseudo-markdown

Use `.github/pull_request_template.md`.

## Frontend Baton Contract

For frontend-heavy batons:

- reconcile stale issue-body paths against the live tree before implementation expands
- keep prompt scope explicit about UI composition, API integration, or validation focus
- do not hand the baton back while more in-scope implementation or review cleanup is still executable
- prefer concise evidence over large pasted logs
- require local CodeRabbit CLI review before final push when the branch changed materially

## Review Sources

Review input may come from:

- human reviewers
- local IDE review agents
- local CodeRabbit CLI runs
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
- re-run local CodeRabbit CLI review (`pnpm review:coderabbit`) when touched files changed materially
- update the PR summary if behavior changed
- update the handoff if risks or follow-ups changed
- resolve or explicitly disposition late-arriving current-head comments before asserting merge-readiness

## Merge Rules

Do not merge until:

- required CI checks pass
- review state is acceptable for the issue risk level
- validation evidence is present
- required handoff details are captured
- current-head unresolved review threads are cleared or explicitly dispositioned
- branch freshness is acceptable for the target branch

Merge method:

- prefer squash merge for normal delivery work
- delete the feature branch after merge

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
- `docs/agent-ref/ops/frontend-baton-prompt-template.md`
