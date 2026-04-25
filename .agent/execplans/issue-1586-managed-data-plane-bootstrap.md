# Issue 1586 Managed Data Plane Bootstrap

## Purpose / Big Picture
- Execute issue `#1586` as the maintenance track for environment bootstrap, managed PostgreSQL/Redis, and staging cost reduction.
- Move production backend compute to AWS ECS/Fargate and establish a real managed production data plane instead of the temporary in-ACA staging pattern.
- Decide whether staging PostgreSQL and Redis should remain near Azure compute or move to AWS-backed managed services based on real cost, latency, and operator complexity instead of credit availability alone.
- Leave the repo with a repeatable bootstrap/deploy model that supports the upcoming authentication/session work in project `#4`.

## Progress
- Done:
  - Re-read the repo issue/branch/process rules in `AGENTS.md`, `CONTRIBUTING.md`, `docs/agent-ref/ops/github-issue-lifecycle.md`, and `docs/agent-ref/ops/pr-review-workflow.md`.
  - Re-read the earlier deployment decision notes in `D:\coloe\decision\cs-008-staging-recovery-decision.md` and `D:\coloe\decision\staging-runtime-input-matrix.md`.
  - Confirmed this work belongs in `lane:maintenance`, not the planned delivery queue.
  - Created issue `#1586`:
    - title: `[OPS] Reduce staging cost and bootstrap managed data plane for staging/production`
    - labels include `type:ops`, `tier:S`, `exec:execplan`, `review:elevated`, `priority:P1`, `severity:S2`
  - Created working branch `fix/1586-managed-data-plane-bootstrap` from current recovery state based on `origin/main`.
  - Confirmed the latest broken `main` deploy was a build regression around Prisma client generation, not an Azure runtime outage.
  - Confirmed staging is live today and production bootstrap does not exist.
  - Landed local repo changes on this branch to:
    - restore backend build reliability by generating Prisma client before app builds
    - generalize ACA bootstrap for staging and production
    - make backend replica counts configurable through environment variables
    - add AWS production workflow/bootstrap surfaces and Cloudflare R2 bootstrap surfaces
    - add the bootstrap precedence fix so explicit `--environment` flags win over ambient `DEPLOY_ENVIRONMENT`
    - address current PR review follow-ups around exact-match resource detection, action pinning, and safer env handling
    - fix SonarCloud `typescript:S4036` hotspots by using fixed absolute command paths in AWS/R2 bootstrap scripts
    - simplify command-path resolution to clear CodeScene code-health gates without weakening the hotspot fix
  - Opened PR `#1587` against `main` for review of the repo-side deployment/runtime split.
  - Updated PR `#1587` development-closing section to `Closes #1586` so merge closes the parent ops issue.
  - Confirmed PR `#1587` review threads are all resolved and linked closing issue references include `#1586`.
  - Validated locally:
    - `pnpm install --frozen-lockfile`
    - `pnpm --filter @collabsphere/web run build`
    - `pnpm --filter @collabsphere/api run build`
    - `pnpm --filter @collabsphere/collab run build`
    - `pnpm --filter @collabsphere/worker run build`
    - staging ACA bootstrap dry-run
    - production ACA bootstrap dry-run
    - YAML parsing for updated workflow/manifests
    - targeted workflow/unit tests for the deploy/bootstrap surfaces
- In progress:
  - Merge-readiness for PR `#1587` (awaiting final human review/merge decision).
  - Choose the remaining staging/production managed data-plane secret ownership details and retirement path.
- Blocked:
  - AWS CLI is installed locally but currently unauthenticated again on this machine (`aws sts get-caller-identity` returns `NoCredentials`).
- Next:
  - Keep the PR body and linked-issue handoff in the canonical repo format.
  - Keep issue handoff/execplan details synchronized with the now-green PR check state.
  - Re-establish AWS auth when the next live provisioning slice starts.
  - Continue the live infra work intentionally left out of this PR: AWS OIDC/services/data plane, R2 runtime credentials/CORS, and staging pg/redis retirement planning.

## Surprises & Discoveries
- The user concern about the latest failed deployment and the cloud topology were two different problems:
  - the latest `main` deploy failure was a build-time Prisma regression
  - the staging waste/durability problem is architectural and operational
- Only staging exists in Azure today:
  - `rg-collabsphere-staging`
  - `cae-collabsphere-staging`
  - `collabspherestgacr260402`
  - staging container apps and migrations job
- The current staging Postgres surface is not durable enough to treat as a real environment database.
- The current staging cost shape is dominated by always-on Container Apps and the temporary data-plane design, not by isolated deployment runs.
- Project `#4` explicitly depends on stable auth/session infrastructure and PRJ-17 rate limiting depends on Redis-backed infra, so this ops track is a real prerequisite and not optional cleanup.

## Decision Log
- Decision: model this work as a single `type:ops` maintenance issue with `tier:S` and `exec:execplan`.
  - Rationale: the work is cross-cloud, multi-session, and spans repo automation, runtime infrastructure, secrets, cost control, and production readiness.
  - Alternatives: open a pure investigation issue first; force the work into the delivery queue as a story/task chain.
  - Source (spec/domain/agent-ref): `docs/agent-ref/ops/github-issue-lifecycle.md`, `.agent/PLANS.md`
- Decision: move production compute to AWS ECS/Fargate.
  - Rationale: the user later clarified that staging must stay Azure-only while production should move to AWS, and the repo now carries first-class AWS production workflow/bootstrap surfaces.
  - Alternatives: keep production compute on Azure Container Apps; keep production unplanned while only optimizing staging.
  - Source (spec/domain/agent-ref): issue `#1586`, `docs/spec/14-devops/14.6-deployment-strategy.md`
- Decision: treat production PostgreSQL and Redis as managed services separate from compute.
  - Rationale: this matches the repo deployment strategy and fixes the current temporary/non-durable database shape.
  - Alternatives: continue using in-ACA Postgres/Redis containers.
  - Source (spec/domain/agent-ref): `docs/spec/14-devops/14.6-deployment-strategy.md`, `docs/agent-ref/ops/deployment.md`
- Decision: do not commit to AWS-backed staging PostgreSQL/Redis until the cost/latency/ops tradeoff is explicitly checked.
  - Rationale: AWS credits alone are not enough to justify a cross-cloud steady-state if operational overhead or latency is worse than the savings.
  - Alternatives: move staging data services to AWS immediately because credits exist.
  - Source (spec/domain/agent-ref): issue `#1586`, live staging inspection, `D:\coloe\decision\staging-runtime-input-matrix.md`
- Decision: preserve the bootstrap-first boundary for environment creation.
  - Rationale: the prior staging recovery already established that `deploy.yml` should remain an incremental deploy workflow rather than a zero-to-one environment creation surface.
  - Alternatives: teach `deploy.yml` to fully provision first-run cloud infrastructure.
  - Source (spec/domain/agent-ref): `D:\coloe\decision\cs-008-staging-recovery-decision.md`, `infra/azure/container-apps/README.md`
- Decision: prefer repo-managed bootstrap code and documented runbooks over one-off portal-only setup.
  - Rationale: production bootstrap and future staging changes need to be repeatable and reviewable.
  - Alternatives: keep the knowledge in manual notes only.
  - Source (spec/domain/agent-ref): `CONTRIBUTING.md`, `.agent/PLANS.md`

## Outcomes & Retrospective
- This cycle established the correct operational tracker, branch, and ExecPlan for the work instead of continuing on stale closed-story context.
- The repo already contains the first enabling changes for this issue:
  - main deploy build repair
  - environment-aware ACA bootstrap
  - configurable replica counts for cost tuning
  - separate Azure staging and AWS production workflow/bootstrap surfaces
  - initial R2 bootstrap and source-controlled infra/docs
- Remaining work is now split between:
  - PR merge-readiness and human approval/merge timing for the repo-side slice (checks are currently green)
  - later live cloud provisioning for the still-missing AWS and R2 runtime pieces

## Context and Orientation
- Issue:
  - `#1586`
- Branch:
  - `fix/1586-managed-data-plane-bootstrap`
- Related project:
  - `#4` `[PRJ-04] User Authentication & Session Management`
- Current repo/runtime files:
  - `.github/workflows/deploy.yml`
  - `.github/workflows/deploy-production-aws.yml`
  - `package.json`
  - `scripts/bootstrap-aca-staging.ts`
  - `scripts/bootstrap-aws-production.ts`
  - `scripts/bootstrap-r2.ts`
  - `infra/azure/container-apps/README.md`
  - `infra/azure/container-apps/api.containerapp.yaml`
  - `infra/azure/container-apps/collab.containerapp.yaml`
  - `infra/azure/container-apps/worker.containerapp.yaml`
  - `infra/aws/ecs/README.md`
  - `infra/cloudflare/r2/README.md`
  - `apps/api/package.json`
  - `apps/collab/package.json`
  - `apps/worker/package.json`
- Prior planning/decision artifacts:
  - `D:\coloe\decision\cs-008-staging-recovery-decision.md`
  - `D:\coloe\decision\staging-runtime-input-matrix.md`
  - `.agent/execplans/deployment-and-data-plane-recovery-2026-04-24.md`
- Cloud state:
  - Azure staging exists and is healthy
  - AWS production bootstrap is partially in place, but the production runtime is not complete yet
  - Cloudflare R2 staging/production buckets were created previously
  - Azure CLI is currently authenticated on this machine
  - AWS CLI is installed locally but not authenticated currently

## Plan of Work
- Milestone 1: lock the target topology and operator model.
  - Acceptance: production and staging targets are explicit for compute, PostgreSQL, Redis, and secrets ownership; AWS staging is either justified or rejected with reasons.
- Milestone 2: establish provider access and bootstrap surfaces.
  - Acceptance: Azure/AWS authentication and repo bootstrap paths are sufficient to inspect, provision, and re-run the chosen environment model safely.
- Milestone 3: implement managed data-plane wiring.
  - Acceptance: staging and production environment contracts point at real managed PostgreSQL/Redis targets instead of the temporary in-ACA services where applicable.
- Milestone 4: bootstrap production and reduce staging waste.
  - Acceptance: production bootstrap resources exist and staging idle cost is reduced through the chosen topology and scaling changes.
- Milestone 5: record validation and recovery guidance.
  - Acceptance: the issue/ExecPlan/runbooks contain enough evidence and recovery detail for later auth work to proceed without rediscovering the environment model.

## Concrete Steps
1. Confirm the desired target split:
   - production compute on AWS ECS/Fargate
   - production PostgreSQL/Redis as managed services
   - staging PostgreSQL/Redis either near Azure or on AWS only if justified
2. Inspect Azure managed service options for production:
   - PostgreSQL
   - Redis
   - regional fit
   - cost/credit constraints
3. Decide the human operator auth model for AWS:
   - preferred: IAM Identity Center / SSO if available
   - fallback: least-privilege IAM access key for CLI bootstrap only if SSO is not available
4. After AWS auth exists, inspect AWS staging candidates:
   - RDS/Aurora
   - ElastiCache / Valkey / Redis-compatible options
   - region, network, and cost tradeoffs against Azure-hosted compute
5. Normalize the environment/secret contract:
   - GitHub env vars and secrets
   - Azure app/job secrets
   - provider connection strings
   - staging vs production differences
6. Implement the repo bootstrap/configuration changes required by the chosen topology.
7. Validate builds, workflow tests, bootstrap dry-runs, and cloud health.
8. Keep PR `#1587`, issue `#1586`, and the durable dossier synchronized as review/provisioning work continues.
9. Update issue `#1586` with progress and any required follow-up issues if the work must be split further.

## Validation and Acceptance
- Commands:
  - `git status --short --branch`
  - `pnpm install --frozen-lockfile`
  - `pnpm --filter @collabsphere/web run build`
  - `pnpm --filter @collabsphere/api run build`
  - `pnpm --filter @collabsphere/collab run build`
  - `pnpm --filter @collabsphere/worker run build`
  - `pnpm exec tsx scripts/bootstrap-aca-staging.ts --environment staging --dry-run`
  - `pnpm exec tsx scripts/bootstrap-aca-staging.ts --environment production --dry-run`
  - `pnpm exec tsx scripts/bootstrap-r2.ts --environment staging --dry-run`
  - `pnpm exec tsx scripts/bootstrap-r2.ts --environment production --dry-run`
  - `pnpm exec tsx scripts/bootstrap-aws-production.ts --environment production --dry-run`
  - `pnpm exec tsx --test --test-concurrency=1 tests/unit/deploy-bootstrap-scripts.test.ts tests/unit/deploy-workflows.test.ts tests/unit/ci-workflow.test.ts`
  - `gh pr view 1587 --json body,reviews,comments,statusCheckRollup,url`
  - `gh issue view 1586 -R Rick1330/collabsphere --json title,labels,url`
  - `gh issue view 4 -R Rick1330/collabsphere --json title,url`
  - `az group list --query "[?contains(name, 'collabsphere')].[name,location]" -o table`
  - `az containerapp env list --query "[].[name,resourceGroup,location]" -o table`
  - `aws sts get-caller-identity`
  - future provider-specific inspection commands once auth exists
- Expected outcomes:
  - issue and branch state stay aligned
  - repo changes parse/build cleanly
  - chosen topology is explicit and defensible
  - cloud bootstrap steps are repeatable rather than ad hoc

## Idempotence and Recovery
- Safe retry steps:
  - re-run local build and bootstrap dry-run commands
  - re-check the live GitHub issue labels/state
  - re-check Azure inventory and health
  - re-check AWS identity after auth is configured
- Rollback steps (if applicable):
  - revert only the issue-scoped repo changes if the topology decision changes
  - do not destroy live staging before a replacement path is ready
- Resume instructions:
  - start with this ExecPlan
  - then read issue `#1586`
  - then read `D:\coloe\decision\cs-008-staging-recovery-decision.md`
  - then inspect current Azure/AWS auth state before taking provisioning actions

## Interfaces and Dependencies
- APIs touched:
  - GitHub issues and environments
  - Azure CLI / ACA / ACR / future managed data services
  - AWS CLI / future managed data services if staging uses AWS
- External deps:
  - Azure subscription and credits
  - possible AWS credits for staging experiments
  - production and staging secret values
  - user/operator authentication to AWS

## Artifacts and Notes
- Issue URL:
  - `https://github.com/Rick1330/collabsphere/issues/1586`
- Auth epic URL:
  - `https://github.com/Rick1330/collabsphere/issues/4`
- Previous live-state recovery artifact:
  - `.agent/execplans/deployment-and-data-plane-recovery-2026-04-24.md`
