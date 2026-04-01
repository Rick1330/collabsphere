# Contributing to CollabSphere

Primary maintainer and code owner: Elshaday Mengesha (`@Rick1330`)

## Purpose

This guide defines the default contribution workflow for CollabSphere. Follow it for feature work, validation work, docs updates, and maintenance work unless a task explicitly says otherwise.

## Canonical References

- `AGENTS.md`
- `docs/spec/14-devops/14.2-local-dev-environment.md`
- `docs/spec/14-devops/14.5-ci-pipeline.md`
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/agent-ref/ops/local-dev.md`
- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/ops/github-issue-lifecycle.md`
- `docs/agent-ref/ops/pr-review-workflow.md`
- `docs/agent-ref/ops/handoff-format.md`
- `docs/agent-ref/ops/branch-protection.md`

## Working Rules

- `main` is the only normal merge target.
- Start from a GitHub issue. GitHub issues are the operational source of truth for delivery work.
- Do not work directly on `main`.
- Use one issue per branch and one branch per PR.
- Keep scope aligned to the issue. Do not silently mix unrelated fixes into the same PR.
- Validate locally before asking for review. If you cannot run a validation step, record why.

## Local Setup

### Prerequisites

- Node.js 20 LTS
- pnpm 9.x
- Docker Desktop or compatible Docker runtime
- Git

### First-time setup

```bash
pnpm install
cp .env.example .env
```

If you need machine-specific app runtime overrides, copy just those keys into
`.env.local` after seeding `.env` from `.env.example`.

Current local env-file split:

- `.env` is the shared local baseline. Docker Compose reads it for infrastructure ports and credentials, and it can also seed local runtime defaults from `.env.example`.
- `.env.local` is for developer-machine-only app runtime overrides and must not be committed.
- `.env.example` now documents both the current Docker Compose infrastructure keys and the canonical local runtime defaults/placeholders used by this repo's env contract.

Required local services are expected to run through Docker Compose:

- PostgreSQL
- Redis
- MailHog

Optional local service:

- MinIO

### Current startup flow

`pnpm dev` is the primary local startup command.

Default startup:

```bash
pnpm dev
```

Current `pnpm dev` behavior:

1. validates repo-local env configuration against `.env.example`
2. starts Docker Compose services by default with a health wait
3. starts `apps/web`, `apps/api`, `apps/collab`, and `apps/worker`

Reuse already-running Docker services with:

```bash
pnpm dev --skip-compose
```

Use `--skip-compose` only when PostgreSQL, Redis, and MailHog are already up and healthy from a previous run or from a separate Docker Compose session.

Optional MinIO startup remains separate because the default orchestrator does not enable the optional compose profile:

```bash
docker compose --profile minio up -d
```

Expected service set:

- `apps/web`
- `apps/api`
- `apps/collab`
- `apps/worker`
- required Docker services

Health checks after startup:

- run `docker compose ps` and confirm PostgreSQL, Redis, and MailHog are healthy or running
- confirm MinIO is healthy too if you enabled the `minio` profile separately
- confirm the `pnpm dev` process stays attached without immediate worker or app exits
- open MailHog at `http://localhost:8025` if enabled locally, or the port configured through `MAILHOG_UI_PORT`
- verify the expected local ports are bound before starting implementation work

### MailHog local email flow

Use these steps when you need to verify outbound email behavior locally without a real provider:

1. Start local services with `pnpm dev` (or `pnpm dev --skip-compose` if Docker services are already healthy).
2. Confirm MailHog is reachable at `http://localhost:8025` (or the overridden `MAILHOG_UI_PORT` value from `.env`).
3. If you need explicit SMTP overrides, set local-only `EMAIL_SMTP_HOST` and `EMAIL_SMTP_PORT` in `.env` or `.env.local` (for example `127.0.0.1` and `1025`).
4. Trigger an app flow that sends email, then verify the message appears in MailHog.

`EMAIL_SMTP_HOST` and `EMAIL_SMTP_PORT` are local-development-only overrides and are not part of the canonical required env list in `docs/spec/07-architecture/07.5-config-environments.md`.

### Common troubleshooting

- Missing `.env`: copy `.env.example` to `.env`, then rerun `pnpm dev`.
- Missing required env keys: add the reported keys to `.env`, using `.env.example` as the reference, then rerun `pnpm dev`.
- Invalid env values: fix the reported key in `.env` or `.env.local`, using `.env.example` as the reference, then rerun `pnpm dev`.
- Docker not running or Compose startup failure: verify Docker is running, rerun `pnpm dev`, and inspect the reported `docker compose` failure before retrying.
- Port conflict: update the conflicting port in `.env`, then rerun `pnpm dev` so Docker Compose restarts with the override.
- MailHog UI port conflict: set `MAILHOG_UI_PORT` in `.env`, then rerun `pnpm dev`. If you are reusing services with `pnpm dev --skip-compose`, manually restart Docker Compose or the MailHog container before opening MailHog on the overridden port.
- MailHog SMTP port conflict: set `MAILHOG_SMTP_PORT` in `.env`, then rerun `pnpm dev`. If you are reusing services with `pnpm dev --skip-compose`, manually restart Docker Compose or the MailHog container before testing SMTP on the overridden port.
- Already-running services: use `pnpm dev --skip-compose` when you intentionally want to reuse a healthy existing Docker Compose session instead of restarting it.
- Service startup failure: inspect `docker compose ps` first, then check the failing service with `docker compose logs <service>`.
- Stale Docker state: stop services, remove stale containers or volumes if appropriate, then restart.
- Dependency drift: run `pnpm install` again after pulling new changes.
- Cache confusion: if Turborepo or package state looks stale, run `pnpm dlx turbo prune` only if you know why; otherwise start with a clean install and rerun the failing command.

## Branching Model

Create branches from `main`.

Recommended names:

- `feature/<issue-number>-<slug>`
- `validate/<issue-number>-<slug>`
- `docs/<issue-number>-<slug>`
- `fix/<issue-number>-<slug>`
- `hotfix/<issue-number>-<slug>`

Examples:

- `feature/197-docker-compose-services`
- `validate/1166-story-validation-cs-001`
- `docs/209-ci-troubleshooting`

## Commit Conventions

Use Conventional Commits:

- `feat(scope): ...`
- `fix(scope): ...`
- `chore(scope): ...`
- `refactor(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`

Examples:

- `feat(api): add workspace invite endpoint`
- `docs(ops): add PR workflow guide`
- `test(web): add task board interaction coverage`

## Issue Workflow

### Delivery lane

Planned delivery work uses the issue hierarchy:

- `type:epic`
- `type:story`
- `type:task`
- `type:validation`

The repo-managed queue manifest in `.github/queue/` defines planned order. Do not edit generated queue files manually unless you are intentionally changing the queue-generation tooling.

### Maintenance lane

Non-roadmap work uses maintenance issue types:

- `type:bug`
- `type:dependency`
- `type:docs`
- `type:ops`
- `type:incident`
- `type:investigation`
- `type:chore`

### Status expectations

- Delivery parents typically use `status:backlog`, `status:planned`, `status:in_progress`, `status:blocked`, `status:done`, `status:cancelled`.
- Implementation tasks typically use `status:ready`, `status:in_progress`, `status:in_review`, `status:blocked`, `status:done`, `status:cancelled`.
- Validation issues typically use `status:ready`, `status:in_progress`, `status:blocked`, `status:done`, `status:cancelled`.
- Maintenance work may use `status:triage` before `status:ready`.

For delivery gate automation, `status:done` and `status:cancelled` are terminal child states. Validation still remains the final completion gate, so cancelled work does not let stories or projects skip validation.

## PR Workflow

### Before opening a PR

- confirm the branch was created from `main`
- confirm the issue scope is met
- run the relevant validation commands
- capture validation evidence and any waivers
- prepare a parent-story handoff if the issue is a delivery task

### PR target

- normal target branch: `main`

### PR requirements

Each PR must include:

- linked issue
- concise summary of changes
- validation commands and outcomes
- risk notes or explicit waivers
- handoff note if the issue requires one

Use the repository PR template.

### Review handling

PR review may come from:

- human reviewers
- local IDE review agents
- Devin Review
- CodeScene

Treat review comments as inputs, not as automatic truth. For each meaningful comment:

- apply the change
- reject it with a concrete reason
- or create a follow-up if it is valid but out of scope

Each executable issue should carry exactly one review-tier label:

- `review:standard`
- `review:elevated`
- `review:critical`

The PR inherits the highest required review tier from its linked issues through the review-router workflow.

Re-run affected validation after review-driven edits.

## Local Validation

Use the task or story issue as the primary validation source. Common commands include:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm test:integration
pnpm build
```

For docs-only changes, validate by checking the expected files and key sections exist and match the referenced workflows.

## CI and Required Checks

`main` is branch-protected with required CI job checks and repo-owned merge gate checks. GitHub currently enforces the raw check identities emitted by the workflows, so ordinary delivery PRs must pass these exact required checks before merge:

- `lint`
- `typecheck`
- `unit-tests`
- `integration-tests`
- `build-web`
- `build-api`
- `build-collab`
- `build-worker`
- `validate`
- `sync`
- `route`

Current CI workflow surface:

- `.github/workflows/ci.yml` emits the `lint`, `typecheck`, `unit-tests`, `integration-tests`, `build-web`, `build-api`, `build-collab`, and `build-worker` checks
- `.github/workflows/handoff-check.yml`, `.github/workflows/pr-status-sync.yml`, and `.github/workflows/review-router.yml` emit the repo-owned gate checks `validate`, `sync`, and `route`
- `.github/workflows/queue-manifest-validate.yml` is path-scoped to queue-manifest surfaces and is not a universal required check for ordinary delivery PRs

Local parity commands for the main CI jobs:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
docker compose up -d postgres redis
docker compose ps
pnpm test:integration
```

Integration tests require PostgreSQL and Redis. In GitHub Actions, the `integration-tests` job brings those services up through workflow services. Locally, start them before running `pnpm test:integration`, then verify with `docker compose ps` that both services are healthy or running.

Workflow files to check when CI fails:

- `.github/workflows/ci.yml`
- `.github/workflows/queue-manifest-validate.yml`
- `.github/workflows/handoff-check.yml`
- `.github/workflows/pr-status-sync.yml`
- `.github/workflows/review-router.yml`
- `.github/workflows/story-project-gates.yml`

GitHub Actions logs:

- open the PR in GitHub
- open the `Checks` tab or the failing workflow run in `Actions`
- inspect the exact failing job and step before retrying locally

If CI fails:

- inspect the failing job first
- reproduce locally where feasible
- fix the root cause rather than retrying blindly
- for integration-test failures, confirm PostgreSQL and Redis are healthy before rerunning locally
- for required-check failures on GitHub, compare the failing check name to the current required-check list above and to the live branch-protection settings before assuming GitHub is misconfigured

## Turborepo Cache Guidance

CollabSphere keeps task graph and cache-input policy in `turbo.json`.

Current cache invalidation inputs include:

- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `packages/shared/src/**`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`

Use normal repo scripts first:

```bash
pnpm build
pnpm test
```

### Common cache troubleshooting

If output looks stale or inconsistent:

1. Reinstall dependencies, then rerun the command that failed (for example `pnpm build` or `pnpm test`):
   ```bash
   pnpm install
   pnpm <failing-command>
   ```
2. Confirm the expected shared inputs changed under `packages/shared/src` (or shared package config files) when investigating rebuild expectations.
3. Check whether env changes (for example `.env` or CI env vars) are affecting runtime behavior outside build cache inputs.
4. If needed, force a no-cache Turbo execution for comparison:
   ```bash
   pnpm dlx turbo run build --force
   ```

### Low-memory guidance

When local memory is constrained, reduce Turbo concurrency during troubleshooting runs:

```bash
pnpm dlx turbo run build --concurrency=50%
```

If memory pressure is still high, run with single-task concurrency:

```bash
pnpm dlx turbo run build --concurrency=1
```

After troubleshooting, return to standard `pnpm build` / `pnpm test` flows.

## Handoff Expectations

Delivery tasks should leave a parent-story handoff comment when work is ready or merged. Use the format in `docs/agent-ref/ops/handoff-format.md`.

Minimum handoff content:

- summary of changes
- validation evidence
- risks or deviations
- follow-up notes if needed

## Code Ownership

Code ownership is defined in `.github/CODEOWNERS`.

Current default code owner:

- Elshaday Mengesha (`@Rick1330`)

## Do Not Do

- do not push directly to `main`
- do not bypass CI expectations
- do not close parent stories or projects just because child implementation tasks merged
- do not edit generated queue files by hand
- do not silently discard review findings without recording the decision in the PR discussion or handoff
