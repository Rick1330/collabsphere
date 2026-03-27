# Branch Protection (agent-ref)

## Purpose

Document the required GitHub branch protection settings for CollabSphere so `main` remains merge-safe and aligned to CI expectations.

## Canonical Sources

- `AGENTS.md`
- `docs/spec/14-devops/14.5-ci-pipeline.md`
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/agent-ref/ops/ci-cd.md`

## Protected Branch

- `main`

## Required Settings

### Require a pull request before merging

Enable:

- require a pull request before merging
- require approvals as appropriate for the repo’s current review policy
- dismiss stale approvals when new commits are pushed

### Require status checks to pass before merging

Enable and require these exact current check names for the repo-operations foundation:

- `Queue Manifest Validate / validate`
- `Handoff Check / validate`
- `Review Router / route`

When the application CI workflows are added, require their exact job names too. The intended minimum application gate remains:

- lint
- typecheck
- unit tests
- integration tests
- build `web`
- build `api`
- build `collab`
- build `worker`

### Require branches to be up to date before merging

Enable this when required checks depend on the latest `main` state.

### Require conversation resolution before merging

Enable to ensure PR review comments are addressed or explicitly resolved.

### Restrict direct pushes

Do not allow direct pushes to `main` for normal contributors.

### Require linear history

Recommended if the team wants a cleaner history. If enabled, use merge methods that preserve the chosen history policy.

## Operational Notes

- branch protection is a GitHub settings step; this file documents the intended configuration
- keep the required-check list aligned with exact workflow and job names as shown in GitHub Checks
- if a new CI gate is promoted to required, update this file and the workflow in the same change
- `review:critical` work should pair branch protection approvals with the review-router check and the repo variable `REQUIRE_HUMAN_APPROVAL_FOR_CRITICAL=true`

## Manual Verification

Verify in GitHub:

- Settings -> Branches -> Branch protection rules
- `main` has the documented protections
- required checks match the workflow job names shown on current PRs

## Related Files

- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/ops/pr-review-workflow.md`
- `.github/pull_request_template.md`
