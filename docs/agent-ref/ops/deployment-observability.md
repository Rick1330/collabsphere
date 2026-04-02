# Deployment Observability (agent-ref)

## Purpose
Provide an execution-focused reference for deployment-health signals, operator views, and first-triage locations across the current Vercel + Azure Container Apps delivery path.

## Canonical Sources
- `DEPLOYMENT.md`
- `docs/spec/14-devops/14.6-deployment-strategy.md`
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/agent-ref/ops/deployment.md`
- `docs/agent-ref/ops/ci-cd.md`
- `.github/workflows/deploy.yml`

## Scope
- Deploy-health signals for staging and production
- GitHub Actions deploy visibility
- Vercel deployment visibility for `web`
- Azure Container Apps visibility for `api`, `collab`, `worker`, and the migrations job
- Minimum metrics and triage workflow for rollout failures

## Verified Baseline
- The current deploy path was verified end to end by `Deploy` run `23918963071`.
- That run completed successfully on `main`, including:
  - backend image build and push
  - migrations job update and execution
  - backend service rollout
  - Vercel deploy
  - post-deploy smoke tests

Use that run as the baseline example of a healthy CS-008 deployment.

## Primary Operator Views

### 1. GitHub Actions `Deploy` workflow
Use the `Deploy` workflow run as the primary control-plane view for rollout health.

First checks:
- overall run conclusion
- duration of `build` and `deploy`
- failure step name
- whether the run stopped before or after backend promotion

High-signal steps in the current workflow:
- `Validate required deployment contracts`
- `Verify Azure Container Apps bootstrap resources exist`
- `Build and push backend images`
- `Update migrations job definition`
- `Run migration job before backend revision promotion`
- `Deploy backend services to Azure Container Apps`
- `Deploy web to Vercel`
- `Run post-deploy smoke tests`

### 2. Vercel deployment view
Use Vercel as the source of truth for the deployed `web` artifact.

Primary checks:
- deployment state for the URL returned by the workflow
- build logs for the matching deployment
- whether the deployment is preview or production
- whether deployment protection affects operator access or automation

### 3. Azure Container Apps service views
Use Azure Container Apps as the source of truth for backend runtime rollout state.

Primary checks:
- latest revision health for `api`
- latest revision health for `collab`
- latest revision health for `worker`
- ingress/FQDN resolution for `api`
- container logs and revision events when rollout or readiness fails

### 4. Azure Container Apps job executions
Use the ACA jobs view as the source of truth for the migrations gate.

Primary checks:
- latest execution state for `AZURE_MIGRATIONS_JOB_NAME`
- start time, completion time, and terminal status
- execution logs for migration failures

## Minimum Deployment Signals

### Deployment success or failure
Track:
- final `Deploy` workflow conclusion
- final `deploy` job conclusion
- Vercel deployment success or failure
- ACA service rollout success or failure
- migrations job success or failure

Primary source:
- GitHub Actions run summary

Secondary sources:
- Vercel deployment status
- Azure Container Apps revisions and job execution history

### Deployment duration
Track:
- total `Deploy` workflow duration
- `build` job duration
- `deploy` job duration
- migrations execution duration
- smoke-test duration when troubleshooting slow rollouts

Primary source:
- GitHub Actions job and step timing

Secondary source:
- ACA job execution timing

### Smoke-test outcome
Track:
- backend smoke-test result
- web smoke-test result
- first failing probe target if smoke tests fail

Current contract:
- backend probe targets the resolved public `api` health URL
- web probe targets the Vercel deployment URL returned by the deploy step

Primary source:
- `Run post-deploy smoke tests`

### Migration-job outcome
Track:
- whether the job definition updated successfully
- whether the execution reached `Succeeded`
- whether the rollout stopped before backend promotion

Primary source:
- `Update migrations job definition`
- `Run migration job before backend revision promotion`

Secondary source:
- ACA job execution history and logs

### Rollback clues
Track:
- which exact step failed first
- whether backend services were updated before the failure
- whether migrations already ran
- whether smoke tests failed after an otherwise successful deploy

These clues determine whether the safest next step is:
- rerun deploy
- inspect service revision health
- inspect migration compatibility
- redeploy a prior known-good backend image or Vercel deployment

## Signal-to-Source Mapping

| Signal | Primary source | First operator view |
|---|---|---|
| Staging deploy failed | GitHub Actions `Deploy` conclusion | GitHub Actions run summary |
| Deploy slowed down | GitHub Actions step timing | GitHub Actions job detail |
| Migration gate failed | ACA job execution status | Azure Container Apps job executions |
| Backend rollout failed | ACA revision or container status | Azure Container Apps service revisions |
| Web deploy failed | Vercel deployment result | Vercel deployment logs |
| Smoke test failed | `Run post-deploy smoke tests` | GitHub Actions deploy job |
| Backend health probe failed | resolved `api` health URL | GitHub Actions logs, then ACA logs |
| Web probe failed | Vercel deployment URL | GitHub Actions logs, then Vercel deployment view |

## First Triage Flow

### Failure before Azure or Vercel deploy
Inspect:
- `Validate required deployment contracts`
- `Verify Azure Container Apps bootstrap resources exist`
- `Build and push backend images`

This usually indicates:
- missing GitHub environment values or secrets
- missing ACA bootstrap resources
- artifact or image-build contract breakage

### Failure at migration gate
Inspect:
- `Update migrations job definition`
- `Run migration job before backend revision promotion`
- ACA job execution logs

This usually indicates:
- job definition drift
- migration runtime failure
- schema/runtime incompatibility

### Failure after backend rollout but before web completion
Inspect:
- `Deploy backend services to Azure Container Apps`
- `Resolve backend smoke-test URL`
- `Deploy web to Vercel`

This usually indicates:
- ACA revision or ingress problems
- Vercel deployment failure

### Failure in post-deploy smoke tests
Inspect:
- `Run post-deploy smoke tests`
- backend health response
- Vercel deployment URL and deployment protection behavior

This usually indicates:
- backend dependency health regression
- wrong web probe target
- protected Vercel surface mismatch

## Non-Goals
- This document does not claim that dashboards are provisioned automatically from the repo.
- This document does not define notification hooks. That belongs to `#233`.
- This document does not perform story validation. That belongs to `#599`.

## Related Files
- `docs/agent-ref/ops/deployment.md`
- `docs/agent-ref/ops/ci-cd.md`
- `DEPLOYMENT.md`
