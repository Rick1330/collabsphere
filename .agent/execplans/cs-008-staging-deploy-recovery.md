# CS-008 Staging Deploy Recovery

## Purpose / Big Picture
- Recover CS-008 staging deployment from reactive blocker-chasing to a deliberate, end-to-end deploy recovery.
- Establish a truthful deployment contract between GitHub Actions, GitHub `staging` environment config, Azure Container Apps resources, and the service runtime env requirements.
- Decide and implement a stable recovery path for first-time staging bootstrap versus normal incremental deploys before resuming downstream CS-008 tasks like `#231`.

## Progress
- Done:
  - Confirmed the full failure chain across runs `23872858098`, `23898773673`, `23900173338`, and `23902653925`.
  - Confirmed GitHub `staging` vars are present, but only four secrets exist and `DATABASE_URL` is missing.
  - Confirmed Azure staging contains only shared foundation resources:
    - ACR `collabspherestgacr260402`
    - managed environment `cae-collabsphere-staging`
  - Confirmed Azure staging currently has no Container Apps and no Container Apps jobs.
  - Confirmed the workflow now upserts the migrations job but still assumes broader runtime/bootstrap state that does not exist yet.
  - Confirmed the current repo has no discovered Prisma schema or Prisma dependency, so the migrations hook is presently a contract/no-op path rather than an active schema migration path.
  - Synced the diagnostic summary into the decision note `cs-008-staging-deploy-root-cause-analysis.md`.
  - Added a first-run ACA bootstrap helper at `scripts/bootstrap-aca-staging.mjs` with `--dry-run` validation support and optional local image seed support via `--build-and-push`.
  - Updated the ACA manifest templates so app names are rendered from environment-specific placeholders instead of hard-coded base names.
  - Narrowed `deploy.yml` to an incremental deploy contract:
    - removed the GitHub `DATABASE_URL` hard requirement from deploy contract validation
    - added an explicit ACA resource existence preflight
    - changed the migrations job path to update an existing job instead of pretending first-run creation is part of normal deploy
  - Renamed the Azure secret reference `email-provider-api-key` to `email-provider-key` to respect ACA secret-name length limits.
  - Enabled staging ACR admin credentials for bootstrap and wired GitHub `staging` with `AZURE_ACR_USERNAME` and `AZURE_ACR_PASSWORD` so incremental deploys can preserve private-image pull auth.
  - Bootstrapped live staging dependency services and workloads in Azure:
    - internal Postgres app
    - internal Redis app
    - `api`, `collab`, and `worker` Container Apps
    - `collabsphere-migrations-stg` job
  - Corrected internal runtime dependency addressing to use ACA app-name networking (`collabsphere-pg-stg`, `collabsphere-redis-stg`) instead of the earlier FQDN attempt.
  - Verified the live runtime path:
    - migrations job execution succeeded
    - `api` health endpoint returned healthy database and Redis checks
    - `collab` and `worker` revisions reached healthy/running state
  - Validated:
    - `deploy.yml` YAML parsing
    - ACA manifest YAML parsing
    - bootstrap script syntax
    - bootstrap dry-run manifest rendering and rendered YAML parsing
- In progress:
  - Move the local workflow/bootstrap fixes through GitHub and re-run the deploy workflow against the recovered staging environment.
- Blocked:
  - Some runtime values are still placeholders (`BASE_URL`, `CORS_ORIGINS`, email, S3-compatible storage), so staging is operational for backend health but not yet final for smoke-test-grade validation.
- Next:
  - Merge/push the local workflow and manifest fixes.
  - Re-run staging and capture the next real blocker, if any.
  - Replace placeholder runtime values with real staging providers before downstream smoke tests.

## Surprises & Discoveries
- The current visible blocker (`DATABASE_URL`) is real but not the deepest one; it only became visible after earlier blockers were cleared.
- The deploy workflow currently mixes bootstrap and incremental deploy behavior without explicitly stating that design choice.
- The private ACR contract has to exist both at bootstrap time and during incremental deploys; fixing only one side leaves the other brittle.
- Internal ACA TCP dependencies should use app-name networking inside the managed environment; the internal FQDN attempt timed out even while Postgres and Redis were healthy.
- The repo currently does not appear to ship Prisma schema assets, so the migrations job is mainly a release-hook contract today.

## Decision Log
- Decision: treat this recovery as `tier:S`.
  - Rationale: repeated multi-session failures now span GitHub, Azure, workflow contracts, runtime env contracts, and deployment topology.
  - Alternatives: continue using narrow follow-up issues and PR review cycles.
  - Source (spec/domain/agent-ref): `.agent/PLANS.md`
- Decision: preserve the Azure foundation already created instead of tearing it down.
  - Rationale: the ACR, managed environment, and OIDC setup are valid building blocks and are not the current source of failure.
  - Alternatives: rebuild Azure from scratch.
  - Source (spec/domain/agent-ref): decision note `azure-deployment-foundation-bootstrap-report.md`
- Decision: separate the immediate failure from the structural failure.
  - Rationale: adding `DATABASE_URL` alone will not make staging deploy succeed because apps, app secrets, and first-run app creation are still unresolved.
  - Alternatives: keep solving only the first visible failure from the latest run.
  - Source (spec/domain/agent-ref): decision note `cs-008-staging-deploy-root-cause-analysis.md`
- Decision: prefer a bootstrap-first recovery path unless new evidence makes full CI bootstrap cheaper and safer.
  - Rationale: current Azure state and workflow shape fit a one-time bootstrap plus incremental deploy model better than a fully self-bootstrapping CI model.
  - Alternatives: make `deploy.yml` provision all apps, all secrets, and all first-run state.
  - Source (spec/domain/agent-ref): `docs/agent-ref/ops/deployment.md`, `.github/workflows/deploy.yml`

## Outcomes & Retrospective
- This ExecPlan now delivers the grounded recovery frame and the first real staging runtime recovery:
  - bootstrap helper
  - incremental deploy workflow contract
  - app-name placeholder correction
  - ACA secret-name compatibility correction
  - ACR pull-auth contract for both bootstrap and incremental deploys
  - live staging bootstrap in Azure
- The main outcome so far is clarity:
  - what was fixed
  - what is still broken
  - why previous cycles kept moving the blocker instead of resolving the story
- Follow-up implementation should use this plan, not resume prompt-level reactive fixes.

## Context and Orientation
- Workflow under recovery:
  - `.github/workflows/deploy.yml`
- Azure deployment assets:
  - `infra/azure/container-apps/api.containerapp.yaml`
  - `infra/azure/container-apps/collab.containerapp.yaml`
  - `infra/azure/container-apps/worker.containerapp.yaml`
  - `infra/azure/container-apps/migrations.job.yaml`
  - `infra/azure/container-apps/backend-service.Dockerfile`
- Runtime contract:
  - `.env.example`
  - `docs/spec/07-architecture/07.5-config-environments.md`
  - `packages/shared/src/api-env.js`
  - `packages/shared/src/runtime-env.js`
- Operational references:
  - `docs/agent-ref/ops/deployment.md`
  - decision note `azure-deployment-foundation-bootstrap-report.md`
  - decision note `staging-runtime-input-matrix.md`
  - decision note `cs-008-staging-deploy-root-cause-analysis.md`
- Affected issues:
  - story `#28`
  - completed follow-ups `#1485`, `#1483`
  - blocked downstream task `#231`

## Plan of Work
- Milestone 1: freeze the actual staging contract.
  - Acceptance: the team agrees whether staging bootstrap is manual/separate or CI-driven, and the required runtime inputs are explicitly enumerated.
- Milestone 2: make first-run backend provisioning truthful.
  - Acceptance: the chosen bootstrap path can create or confirm all required backend resources and secrets in Azure without relying on undefined prior state.
- Milestone 3: restore a successful staging deploy.
  - Acceptance: a `Deploy` run on `main` completes through backend rollout and web deployment, or fails on a materially later, newly identified blocker.
- Milestone 4: only after deploy health is real, resume downstream CI smoke-test work.
  - Acceptance: `#231` can be reactivated based on evidence rather than assumption.

## Concrete Steps
1. Confirm the recovery boundary:
   - Option A: one-time bootstrap outside `deploy.yml`, then incremental CI deploys.
   - Option B: full bootstrap logic encoded in `deploy.yml`.
2. Inventory the full required staging runtime values:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_ACCESS_SECRET`
   - `CORS_ORIGINS`
   - `EMAIL_PROVIDER_API_KEY` or SMTP alternative if intentionally supported
   - `API_BASE_URL`
   - `BASE_URL`
   - `COLLAB_DATABASE_URL`
   - `COLLAB_JWT_SECRET`
   - `COLLAB_WS_URL`
   - `S3_BUCKET`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_REGION`
   - optional `S3_ENDPOINT`
3. Decide where each value lives:
   - GitHub environment secret
   - Azure Container App secret
   - bootstrap script input
4. Build the bootstrap path:
   - create the three apps if absent
   - create/update the migrations job if absent
   - provision required app secrets before first app deployment
5. Narrow `deploy.yml` to the chosen contract:
   - if bootstrap-first: require only incremental-deploy-safe assumptions
   - if full bootstrap: explicitly provision all required first-run state
6. Re-run staging deploy.
7. Capture the next real blocker and update this plan.

## Validation and Acceptance
- Commands:
  - `gh run list --workflow Deploy --limit 10 --json databaseId,displayTitle,headSha,conclusion,createdAt,url`
  - `gh api 'repos/Rick1330/collabsphere/environments/staging/variables?per_page=100'`
  - `gh api repos/Rick1330/collabsphere/environments/staging/secrets`
  - `az resource list --resource-group rg-collabsphere-staging -o json`
  - `az containerapp list --resource-group rg-collabsphere-staging -o json`
  - `az containerapp job list --resource-group rg-collabsphere-staging -o json`
  - `Get-Content .github/workflows/deploy.yml`
  - `Get-Content infra/azure/container-apps/*.yaml`
- Expected outcomes:
  - the chosen bootstrap/deploy boundary is explicit
  - the actual required secrets and resources are fully enumerated
  - the next implementation cycle can target a complete recovery step instead of the last surfaced symptom

## Idempotence and Recovery
- Safe retry steps:
  - re-run the GitHub environment inventory commands
  - re-run the Azure resource inventory commands
  - re-read the current workflow and manifests before resuming
- Rollback steps (if applicable):
  - none yet; this plan is diagnostic
- Resume instructions:
  - start with this ExecPlan
  - then read the decision note `cs-008-staging-deploy-root-cause-analysis.md`
  - then inspect the latest `Deploy` run on `main`
  - do not resume from old decider prompts alone

## Interfaces and Dependencies
- APIs touched:
  - GitHub CLI / GitHub environment API
  - Azure CLI / Azure Container Apps resources
- Events emitted:
  - none yet
- Schema changes:
  - none
- External deps:
  - GitHub environment configuration
  - Azure Container Registry
  - Azure Container Apps managed environment
  - future staging providers for database, Redis, email, and S3-compatible storage

## Artifacts and Notes
- Failure-history evidence:
  - `23872858098`
  - `23898773673`
  - `23900173338`
  - `23902653925`
- Diagnostic write-up:
  - decision note `cs-008-staging-deploy-root-cause-analysis.md`
- Azure foundation record:
  - decision note `azure-deployment-foundation-bootstrap-report.md`
- Runtime input inventory:
  - decision note `staging-runtime-input-matrix.md`
