# Review Automation (agent-ref)

## Purpose

Define how CollabSphere uses automated review tools and local review agents in the PR layer without giving them merge authority by themselves.

## Canonical Sources

- `AGENTS.md`
- `docs/agent-ref/ops/pr-review-workflow.md`
- `docs/agent-ref/ops/ci-cd.md`

## Review Layers

CollabSphere uses separate layers for:

- working-agent implementation
- review routing and policy enforcement
- automated PR review tools
- human approval where required

The working agent owns the branch and resolves review comments. Review agents and automated reviewers produce findings; they do not silently take over branch ownership.

## Review Tiers

### `review:standard`

- working agent self-review
- at least one additional review source before merge
- review source may be human, local IDE review agent, Devin Review, or CodeScene

### `review:elevated`

- working agent self-review
- two independent review passes recommended
- at least one review pass should be independent from the working agent
- security, isolation, realtime, and regression risk should be reviewed explicitly where relevant

### `review:critical`

- working agent self-review
- independent review passes
- human approval required before merge
- no auto-merge based only on bot comments or automated review output

## Automated Review Tools

### Devin Review

Best fit:

- PR review comments
- suggested changes
- advisory findings on linked issues

Recommended operational model:

- enable through the GitHub app or repo-level auto-review configuration
- trigger on PR ready-for-review
- treat findings as advisory review input
- do not let Devin Review close issues or merge PRs by itself

### CodeScene

Best fit:

- maintainability review
- hotspot and code-health warnings
- advisory PR quality gates

Recommended operational model:

- run on PRs targeting `main`
- start in advisory mode
- tighten quality gates only after the repo has enough history and the team trusts the signals
- do not use CodeScene as the queue controller

## Review Router Responsibilities

The repo-native review router workflow should:

- read linked issues from the PR body
- require exactly one `review:*` label on each linked executable issue
- determine the highest required review tier
- sync that review tier onto the PR for visibility
- post or update a sticky policy comment describing the expected review level
- report both configured external review integrations and the review activity actually detected on the PR
- enforce human approval for `review:critical` PRs

The review router should not:

- auto-merge PRs
- auto-close issues
- treat bot comments as approval by themselves

## Repository Variables

Recommended repository variables for review integrations:

- `DEVIN_REVIEW_ENABLED=true|false`
- `CODESCENE_ENABLED=true|false`
- `REQUIRE_HUMAN_APPROVAL_FOR_CRITICAL=true|false`

These variables let the review router explain which external review layers are expected in the repo.

## Review Comment Resolution

For each meaningful review comment:

- apply the change
- reject it with a concrete reason
- or defer it into a follow-up issue if valid but out of scope

After review-driven changes:

- re-run affected validation
- update the PR summary if behavior changed
- update handoff content if risks or follow-ups changed

## Related Files

- `docs/agent-ref/ops/pr-review-workflow.md`
- `.github/pull_request_template.md`
- `.github/workflows/review-router.yml`
