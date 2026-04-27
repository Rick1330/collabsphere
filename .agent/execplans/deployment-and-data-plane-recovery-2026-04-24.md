# Deployment And Data Plane Recovery (2026-04-24)

## Purpose / Big Picture
- Recover the latest broken `main` deployment without drifting off the repo's process model.
- Reassess staging and production against the actual live cloud footprint, cost shape, and data-plane gaps.
- Define the next delivery boundary for dedicated PostgreSQL and Redis infrastructure, with AWS as the intended managed-services target.

## Progress
- Done:
  - Re-read repo process rules in `AGENTS.md`, `CONTRIBUTING.md`, `docs/agent-ref/ops/README.md`, `docs/agent-ref/ops/github-issue-lifecycle.md`, `.github/queue/README.md`, and `docs/spec/14-devops/14.7-release-process.md`.
  - Confirmed the paused local branch `feature/229-deploy-workflow-staging-and-prod-gates` is not the correct execution base for current recovery work.
  - Created a clean recovery clone from current `origin/main` in a dedicated local workspace.
  - Confirmed the latest successful deploy on `main` was run `24883040660` on 2026-04-24 for commit `584fd28b801d6c26f20d92aaa6dac6bc753bcf6b`.
  - Confirmed the latest failed deploys on `main` were runs `24887346156` and `24892370485`, both failing in the `build` job before any Azure mutation.
  - Confirmed the current failure cause is Prisma client generation missing before app builds:
    - `packages/shared/src/types/prisma.ts` imports generated model types from `@prisma/client`
    - `apps/api`, `apps/collab`, and `apps/worker` build scripts did not generate Prisma client first
  - Confirmed live staging Azure state in subscription `c4833a5d-b9b9-4d2f-b256-90585d8e9e74`:
    - resource group `rg-collabsphere-staging`
    - ACR `collabspherestgacr260402`
    - managed environment `cae-collabsphere-staging`
    - container apps `collabsphere-pg-stg`, `collabsphere-redis-stg`, `collabsphere-api-stg`, `collabsphere-collab-stg`, `collabsphere-worker-stg`
    - job `collabsphere-migrations-stg`
  - Confirmed live staging health endpoint is healthy at:
    - `https://collabsphere-api-stg.victoriouscliff-7e9d7931.uaenorth.azurecontainerapps.io/api/v1/health`
  - Confirmed GitHub `staging` environment is populated and GitHub `production` environment is materially incomplete.
  - Validated the narrow Prisma build repair locally with fresh installs and successful `web`, `api`, `collab`, and `worker` builds.
  - Generalized the ACA bootstrap path so the repo can bootstrap either staging or production instead of remaining staging-only.
  - Added environment-configurable ACA replica settings so staging cost controls can be applied through environment vars instead of hardcoded manifests.
- In progress:
  - Define the next issue/work split for dedicated PostgreSQL and Redis plus production rollout.
- Blocked:
  - AWS inspection and provisioning cannot proceed until AWS authentication exists on this machine.
- Next:
  - Validate the Prisma-generation build repair locally where feasible.
  - Decide whether dedicated PostgreSQL and Redis remain cross-cloud from Azure staging, or whether backend compute should move with them.
  - Create or align the next GitHub issues in the correct lane (`type:ops` / `type:investigation` or a new delivery story if scope changes canonically).

## Surprises & Discoveries
- The currently broken deploy is not a cloud-runtime failure. It is a build-time regression on `main`.
- CS-008 is already closed and validated. The current work is therefore follow-up maintenance/ops or a new explicitly planned delivery slice, not a continuation of the old task branch.
- Staging is healthier than the older decision notes suggest. Azure staging is live and serving traffic today.
- The staging PostgreSQL service is running as a plain Container App with no mounted volume declared in the live template. That means it is not a durable database surface.
- The current staging cost shape is driven less by one broken workflow run and more by an always-on topology:
  - 5 running Container Apps with `minReplicas: 1`
  - 1 Basic ACR
- The Azure billing CLI on this subscription returns usage rows with `pretaxCost: None`, so direct CLI cost attribution is weak even though the live resource footprint is clear.
- AWS CLI is installed, but there is no configured AWS auth on this machine yet.

## Decision Log
- Decision: base recovery work on current `origin/main`, not the paused local branch.
  - Rationale: `main` is the deployable line and the live failure exists there.
  - Alternatives: continue on `feature/229...`.
  - Source (spec/domain/agent-ref): `AGENTS.md`, `CONTRIBUTING.md`, `docs/spec/14-devops/14.7-release-process.md`
- Decision: treat the latest broken deploy as an immediate `type:ops` repair even though the larger topology discussion is broader.
  - Rationale: staging deploy automation must be restored before higher-order infra changes can be trusted.
  - Alternatives: defer the build repair until after architecture planning.
  - Source (spec/domain/agent-ref): `docs/agent-ref/ops/ci-cd.md`, `CONTRIBUTING.md`
- Decision: treat dedicated PostgreSQL and Redis as a separate data-plane follow-up, not something to mix invisibly into the narrow CI build repair.
  - Rationale: it changes runtime ownership, cloud boundaries, secret models, and likely issue scope.
  - Alternatives: slip AWS data-plane work into the same patch as the deploy repair.
  - Source (spec/domain/agent-ref): `docs/agent-ref/ops/github-issue-lifecycle.md`, `.github/queue/README.md`
- Decision: keep the current Azure staging surface alive for now, but do not treat its internal Postgres and Redis apps as the desired long-term state.
  - Rationale: it is the only live validated staging surface today, but it is cost-inefficient and the database layer is not durable.
  - Alternatives: tear it down immediately before the replacement is ready.
  - Source (spec/domain/agent-ref): `docs/spec/14-devops/14.6-deployment-strategy.md`, live Azure resource inspection

## Outcomes & Retrospective
- Immediate recovery target:
  - restore successful `main` deploy builds
- Structural findings:
  - production deploy contract is not provisioned
  - current staging data plane is temporary and operationally weak
  - AWS-managed PostgreSQL and Redis work should be planned as explicit follow-up execution, not hidden under the already-closed CS-008 story

## Context and Orientation
- Repo/process references:
  - `AGENTS.md`
  - `CONTRIBUTING.md`
  - `docs/agent-ref/ops/github-issue-lifecycle.md`
  - `.github/queue/README.md`
  - `.github/queue/projects/PRJ-01.yaml`
- Deployment/runtime references:
  - `.github/workflows/deploy.yml`
  - `DEPLOYMENT.md`
  - `infra/azure/container-apps/README.md`
  - `scripts/bootstrap-aca-staging.ts`
  - `packages/database/package.json`
  - `packages/shared/src/types/prisma.ts`
- Latest run evidence:
  - success: `24883040660` on 2026-04-24
  - failures: `24887346156`, `24892370485` on 2026-04-24
- Live cloud evidence:
  - Azure subscription: `Azure for Students`
  - resource group: `rg-collabsphere-staging`
  - staging API health endpoint healthy as of 2026-04-24

## Plan of Work
- Milestone 1: restore the broken `main` deploy build path.
  - Acceptance: current app build surfaces no longer fail on missing generated Prisma client types.
- Milestone 2: define the next infra scope cleanly.
  - Acceptance: dedicated PostgreSQL/Redis and production rollout work is split into the correct issue lane and execution slices.
- Milestone 3: reduce waste and operational risk in staging.
  - Acceptance: the team has an approved plan for either shrinking Azure staging spend or migrating the data plane off the temporary internal Container Apps services.

## Concrete Steps
1. Patch app build scripts so `@prisma/client` generation happens before `api`, `collab`, and `worker` builds.
2. Validate the fix against the same failure mode that broke runs `24887346156` and `24892370485`.
3. Record the current live-state findings:
   - staging healthy on commit `584fd28`
   - production environment incomplete
   - internal Postgres non-durable
   - Redis and backend services always-on
4. Decide the dedicated data-plane direction:
   - Option A: keep Azure compute and move only PostgreSQL/Redis
   - Option B: move backend compute together with PostgreSQL/Redis to AWS
5. Prefer an execution split that avoids cross-cloud Redis for long-running steady-state use unless latency is proven acceptable.
6. After AWS auth exists, inspect:
   - RDS / Aurora options
   - ElastiCache / Redis options
   - region fit and credit-backed cost profile
7. Only then implement production and dedicated data-plane automation in separate scoped changes.

## Validation and Acceptance
- Commands:
  - `gh run view 24892370485 --log-failed`
  - `gh run view 24887346156 --log-failed`
  - `gh run view 24883040660 --json conclusion,url,jobs`
  - `az resource list --resource-group rg-collabsphere-staging -o json`
  - `Invoke-RestMethod https://collabsphere-api-stg.victoriouscliff-7e9d7931.uaenorth.azurecontainerapps.io/api/v1/health | ConvertTo-Json -Depth 6`
  - `gh api repos/Rick1330/collabsphere/environments/staging/variables?per_page=100`
  - `gh api repos/Rick1330/collabsphere/environments/production/variables?per_page=100`
- Expected outcomes:
  - the build regression root cause is explicit
  - the live staging and production gaps are explicit
  - follow-up work can be split cleanly without hand-waving about current state

## Idempotence and Recovery
- Safe retry steps:
  - re-run the GitHub Actions inspection commands
  - re-run the Azure inventory and health commands
  - re-check app build scripts against `packages/shared/src/types/prisma.ts`
- Rollback steps (if applicable):
  - if the build repair is wrong, revert only the narrow build-script changes
- Resume instructions:
  - start with this ExecPlan
  - confirm whether the target remains current `origin/main`
  - inspect latest `Deploy` runs before assuming the failure mode is unchanged

## Interfaces and Dependencies
- APIs touched:
  - GitHub CLI / GitHub Actions / GitHub environments API
  - Azure CLI / Azure Container Apps / ACR
  - future AWS CLI / AWS service APIs once authenticated
- External deps:
  - Azure subscription and current staging resources
  - GitHub deployment environments
  - AWS account auth not yet present locally

## Artifacts and Notes
- Current healthy staging backend commit:
  - `584fd28b801d6c26f20d92aaa6dac6bc753bcf6b`
- Current broken deploy commits:
  - `3c829b06fa5a5e77ed8879e20cad19153e8c4c2d`
  - `679f255747ee4c71407eb5f7c3591bf79a67efa5`
- Related older deployment recovery plan:
  - `.agent/execplans/cs-008-staging-deploy-recovery.md`
