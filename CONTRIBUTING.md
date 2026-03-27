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

- Node.js 22+
- pnpm 10+
- Docker Desktop or compatible Docker runtime
- Git

### First-time setup

```bash
pnpm install
cp .env.example .env.local
```

Required local services are expected to run through Docker Compose:

- PostgreSQL
- Redis
- MailHog

Optional local service:

- MinIO

### One-command startup

```bash
pnpm dev
```

Expected service set:

- `apps/web`
- `apps/api`
- `apps/collab`
- `apps/worker`
- required Docker services

Health checks after startup:

- run `docker compose ps` and confirm PostgreSQL, Redis, and MailHog are healthy or running
- confirm the `pnpm dev` process stays attached without immediate worker or app exits
- open MailHog at `http://localhost:8025` if enabled locally
- verify the expected local ports are bound before starting implementation work

If startup fails:

- verify Docker is running
- verify `.env.local` is present and aligned with `.env.example`
- verify required ports are free or overridden in local env
- inspect service logs before retrying

### Common troubleshooting

- Port conflict: update the conflicting port in `.env.local`, then restart.
- Missing env vars: copy missing keys from `.env.example` and retry.
- Stale Docker state: stop services, remove stale containers or volumes if appropriate, then restart.
- Dependency drift: run `pnpm install` again after pulling new changes.
- Cache confusion: if Turborepo or package state looks stale, run `pnpm turbo prune` only if you know why; otherwise start with a clean install and rerun the failing command.

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
pnpm -w test:unit
pnpm -w test:integration
pnpm -w build
```

For docs-only changes, validate by checking the expected files and key sections exist and match the referenced workflows.

## CI and Required Checks

Minimum required PR checks:

- lint
- typecheck
- unit tests
- integration tests
- build for `web`, `api`, `collab`, and `worker`

Integration tests require the necessary backing services.

Workflow files to check when CI fails:

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

## Turborepo Cache Guidance

CollabSphere uses Turborepo-style task orchestration. Cache-related issues are usually one of:

- stale dependency install state
- changed environment variables
- build output drift after branch switches
- low-memory or low-disk conditions on the local machine

Start with:

```bash
pnpm install
pnpm lint
pnpm typecheck
```

If cache behavior looks wrong, prefer a clean local reinstall and a targeted rerun before attempting broader cache cleanup.

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
