# Deployment

## Purpose

This document describes the current CS-008 deployment process for:

- `web` on Vercel
- `api`, `collab`, and `worker` on Azure Container Apps

It is intentionally operational and current-state focused. It documents what is already in place, what still requires manual setup, and which gaps remain open.

## Current State

### What is already in place

- Azure foundation for staging exists.
  - Resource group, Azure Container Registry, and Azure Container Apps environment were created.
  - GitHub Actions OIDC identity for Azure staging deploys was created and granted access.
- Staging Azure workloads now exist:
  - internal Postgres app
  - internal Redis app
  - `api`, `collab`, and `worker` Container Apps
  - `collabsphere-migrations-stg` Container Apps job
- GitHub `staging` environment now contains the Azure and Vercel deploy-time values required by `.github/workflows/deploy.yml`, including ACR pull credentials for incremental deploys.
- The GitHub deploy workflow from [deploy.yml](./.github/workflows/deploy.yml) is landed on `main`.
- Backend deployment assets exist under [infra/azure/container-apps/](./infra/azure/container-apps/).

### What is not finished yet

- Some staging runtime values are still temporary placeholders and should be replaced before smoke-test-grade staging:
  - `BASE_URL`
  - `CORS_ORIGINS`
  - email provider key
  - S3-compatible storage values
- Production still needs its own final environment provisioning and runtime inputs before it should be treated as operational.

### Important truth about staging today

The staging backend is bootstrapped and healthy in Azure, and the recovered GitHub deploy path is now validated by successful `Deploy` run `23918963071` on `main`.

## Deployment Architecture

### Web

- Hosted on Vercel
- Uses the static artifact produced in `apps/web/dist`
- Staging deploys from `main` use Vercel preview mode
- Production deploys use `vercel build --prod` followed by `vercel deploy --prebuilt --prod`

### Backend

- `api`, `collab`, and `worker` are packaged as OCI-compatible images
- Preferred runtime is Azure Container Apps
- The image/build contract is defined in:
  - [infra/azure/container-apps/README.md](./infra/azure/container-apps/README.md)
  - [backend-service.Dockerfile](./infra/azure/container-apps/backend-service.Dockerfile)

### Revision and migration contract

- Backend revisions are promoted only after the migrations job succeeds
- The current backend service manifests use single-revision rollout
- The workflow updates the migrations job definition to the current release image before starting the job
- The workflow then waits for a successful migrations execution before promoting backend services

## GitHub Actions Environments

### Staging

The `staging` GitHub environment is the current deploy target for automatic deploys on merge to `main`.

Deploy-time configuration for `staging` is expected in GitHub Actions environment scope, not in `.env.example`.

#### Required GitHub environment variables

- `AZURE_RESOURCE_GROUP`
- `AZURE_LOCATION`
- `AZURE_MANAGED_ENVIRONMENT_ID`
- `AZURE_CONTAINER_REGISTRY_NAME`
- `AZURE_CONTAINER_REGISTRY_LOGIN_SERVER`
- `AZURE_ACR_USERNAME`
- `AZURE_MIGRATIONS_JOB_NAME`
- `AZURE_S3_AUTH_ID_REF`
- `AZURE_S3_AUTH_VALUE_REF`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### Optional GitHub environment variables with workflow defaults

- `AZURE_API_CONTAINERAPP_NAME`
  - default: `collabsphere-api`
- `AZURE_COLLAB_CONTAINERAPP_NAME`
  - default: `collabsphere-collab`
- `AZURE_WORKER_CONTAINERAPP_NAME`
  - default: `collabsphere-worker`

#### Required GitHub environment secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_ACR_PASSWORD`
- `VERCEL_TOKEN`
- `DEPLOY_NOTIFICATION_WEBHOOK_URL`

The deploy workflow posts a compact Discord notification after each staging or production run using the environment-scoped `DEPLOY_NOTIFICATION_WEBHOOK_URL` secret.

### Production

Production is still manual or tag-gated by design.

Before production deploys are usable, production needs its own GitHub environment configuration, approval rules, and runtime inputs. This document does not claim that production is fully provisioned today.

## Runtime Inputs Still Required

The deploy workflow variables are not enough to complete the first staging rollout. The application runtime still needs real provider values and secrets.

Internal ACA dependency networking should use app names inside the managed environment:

- Postgres: `collabsphere-pg-stg:5432`
- Redis: `collabsphere-redis-stg:6379`

### Shared backend secret names expected by Container Apps

- `database-url`
- `redis-url`
- `jwt-access-secret`
- `cors-origins`
- `email-provider-key`
- `api-base-url`
- `base-url`

### Collab and worker secret names expected by Container Apps

- `collab-database-url`
- `collab-jwt-secret`
- `collab-ws-url`
- `s3-bucket`
- `s3-region`

The `collab` and `worker` manifests do not hard-code the S3 credential secret names.

- `AZURE_S3_AUTH_ID_REF` must be set to the Azure Container Apps secret name that holds the S3 access key ID.
- `AZURE_S3_AUTH_VALUE_REF` must be set to the Azure Container Apps secret name that holds the S3 secret access key.

Recommended canonical secret names:

- `s3-access-key-id`
- `s3-secret-access-key`

### Optional storage secret not currently used by the Container Apps manifests

- `s3-endpoint`

This is only relevant if staging uses a non-AWS S3-compatible endpoint. The current `collab` and `worker` Container Apps manifests do not wire an `S3_ENDPOINT` environment variable yet.

## Staging Deployment Flow

### Normal trigger

- Merge PR to `main`
- GitHub Actions runs `Deploy`
- `resolve-target` selects `staging`
- `build` validates the commit is already on `main`, installs dependencies, and builds deployable artifacts
- `deploy` validates environment-scoped deploy contracts, authenticates to Azure, prepares backend rollout, and deploys web to Vercel

### What must exist before the first successful staging deploy

1. GitHub `staging` environment variables and secrets
2. Real runtime secrets and provider values for the application
3. Existing Azure Container Apps services for:
   - `api`
   - `collab`
   - `worker`
4. Existing Azure Container Apps migrations job

The current workflow updates existing workloads. It does not create the first Container Apps services or the first migrations job from nothing.

### Current staging status

- The current GitHub deploy workflow is healthy on `main`.
- The latest verified successful run is `23918963071`.
- Remaining deployment work is now about observability, notifications, and story validation rather than deploy-path recovery.

## Production Deployment Flow

### Trigger options

- manual `workflow_dispatch`
- release tag matching `v*`

### Guardrails

- production is not automatic on merge
- the workflow validates that the target commit is already merged into `main`
- the deploy flow reuses the same overall Vercel + Azure Container Apps architecture as staging

### Current reality

Production should be treated as not yet operational until:

- production GitHub environment values and secrets are provisioned
- production runtime secret sources are chosen
- production Azure and Vercel targets are confirmed

## Rollback Guidance

### Web rollback

- Roll back by redeploying a previous known-good Vercel deployment or commit
- Keep rollback aligned with the same `main`-based release path

### Backend rollback

- Roll back by redeploying a previous known-good backend image tag
- Prefer revision/image rollback only when the database schema is still compatible

### Migration-aware rollback warning

If a schema migration already ran successfully, do not assume the previous backend image is safe to restore unchanged. Check schema compatibility first.

The current repo does not claim automatic schema rollback.

## Troubleshooting

### `Validate required deployment contracts` fails immediately

This means one or more GitHub environment-scoped values are missing.

Common examples:

- `AZURE_RESOURCE_GROUP is required for deploy.yml.`
- missing Azure OIDC secrets
- missing Vercel org/project/token values

Check the target GitHub Actions environment, not `.env.example`.

### Staging deploy fails before Azure update or Vercel deploy

This usually means the runtime inputs or workload bootstrap are incomplete, not that the deploy workflow syntax is wrong.

Check:

- runtime secret values exist
- initial Container Apps services exist
- migrations job exists

### Azure region creation fails

The current Azure for Students subscription is region-restricted.

Allowed regions discovered during staging bootstrap:

- `australiaeast`
- `centralindia`
- `uaenorth`
- `spaincentral`
- `switzerlandnorth`

If a resource create/update flow is attempted in another region, Azure policy can reject it.

### Migrations behavior regresses after a future change

The workflow currently updates the migrations job definition before starting the job. If migrations start failing again after a workflow or manifest change, inspect:

- `Update migrations job definition`
- `Run migration job before backend revision promotion`
- Azure Container Apps job execution history and logs

## Related References

- [docs/spec/14-devops/14.6-deployment-strategy.md](./docs/spec/14-devops/14.6-deployment-strategy.md)
- [docs/spec/14-devops/14.7-release-process.md](./docs/spec/14-devops/14.7-release-process.md)
- [docs/agent-ref/ops/deployment.md](./docs/agent-ref/ops/deployment.md)
- [docs/agent-ref/ops/ci-cd.md](./docs/agent-ref/ops/ci-cd.md)
- [docs/agent-ref/ops/deployment-observability.md](./docs/agent-ref/ops/deployment-observability.md)
- [infra/azure/container-apps/README.md](./infra/azure/container-apps/README.md)
