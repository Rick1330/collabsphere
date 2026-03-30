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

Enable and require these exact current check names on `main`:

- `CI / lint`
- `CI / typecheck`
- `CI / unit-tests`
- `CI / integration-tests`
- `CI / build-web`
- `CI / build-api`
- `CI / build-collab`
- `CI / build-worker`
- `Handoff Check / validate`
- `PR Status Sync / sync`
- `Review Router / route`

Do not mark these as universal required checks in branch protection:

- `Queue Manifest Validate / validate`, because it is path-scoped to `.github/queue/**` changes and will not run on ordinary delivery PRs
- third-party review integrations such as `CodeRabbit`, `DeepScan`, or `CodeScene Code Health Review (main)` unless repo policy explicitly promotes them to required status checks later

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
- keep the required-check list aligned with the exact `workflow name / job name` strings shown in GitHub Checks
- if a new CI gate is promoted to required, update this file and the workflow in the same change
- after applying the branch rule in the GitHub UI, verify the selected required checks exactly match the current list above instead of older foundation-era names
- `review:critical` work should pair branch protection approvals with the review-router check and the repo variable `REQUIRE_HUMAN_APPROVAL_FOR_CRITICAL=true`

## Manual Verification

Verify in GitHub:

- Settings -> Branches -> Branch protection rules
- add or edit the `main` rule so it enables the documented protections
- under `Require status checks to pass before merging`, select only the exact current checks listed above
- confirm `Queue Manifest Validate / validate` is not selected as a universal required check
- `main` has the documented protections and the selected checks match the current PR checks surface

## Related Files

- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/ops/pr-review-workflow.md`
- `.github/pull_request_template.md`
