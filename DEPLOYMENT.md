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
- GitHub `staging` environment now contains the Azure and Vercel deploy-time values required by `.github/workflows/deploy.yml`.
- The deploy workflow from [deploy.yml](./.github/workflows/deploy.yml) is landed on `main`.
- Backend deployment assets exist under [infra/azure/container-apps/](./infra/azure/container-apps/).

### What is not finished yet

- Runtime application secrets and provider values are still missing for the first end-to-end staging deploy.
- The initial Azure Container Apps workloads and the migrations job still need to exist with real runtime configuration before the first full deploy can succeed.
- The deploy workflow still has a known follow-up for migrations-job image management:
  - `#1483` `[CS-008 follow-up] Update migrations job image during deploy workflow`

### Important truth about staging today

The current staging deployment is not fully runnable yet just because the workflow and Azure foundation exist. The workflow contract is in place, but the runtime inputs and first workload creation are still incomplete.

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
- The workflow currently starts an existing migrations job before updating backend services
- The open follow-up in `#1483` exists because the workflow does not yet clearly update that migrations job to the current release image before execution

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
- `VERCEL_TOKEN`

### Production

Production is still manual or tag-gated by design.

Before production deploys are usable, production needs its own GitHub environment configuration, approval rules, and runtime inputs. This document does not claim that production is fully provisioned today.

## Runtime Inputs Still Required

The deploy workflow variables are not enough to complete the first staging rollout. The application runtime still needs real provider values and secrets.

### Shared backend secret names expected by Container Apps

- `database-url`
- `redis-url`
- `jwt-access-secret`
- `cors-origins`
- `email-provider-api-key`
- `api-base-url`
- `base-url`

### Collab and worker secret names expected by Container Apps

- `collab-database-url`
- `collab-jwt-secret`
- `collab-ws-url`
- `s3-bucket`
- `s3-access-key-id`
- `s3-secret-access-key`
- `s3-region`

### Optional storage secret

- `s3-endpoint`

This is only required if staging uses a non-AWS S3-compatible endpoint.

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

### Current known staging blocker

The first staging deploy will still fail until runtime inputs are chosen and the first ACA workloads/job exist. The deploy workflow alone does not solve that bootstrap gap.

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

- `austriaeast`
- `centralindia`
- `uaenorth`
- `spaincentral`
- `switzerlandnorth`

If a resource create/update flow is attempted in another region, Azure policy can reject it.

### Migrations behavior does not match the current release image

This is the known workflow follow-up tracked in `#1483`.

Do not assume the migrations job image is updated automatically by the current workflow until that follow-up lands.

## Related References

- [docs/spec/14-devops/14.6-deployment-strategy.md](./docs/spec/14-devops/14.6-deployment-strategy.md)
- [docs/spec/14-devops/14.7-release-process.md](./docs/spec/14-devops/14.7-release-process.md)
- [docs/agent-ref/ops/deployment.md](./docs/agent-ref/ops/deployment.md)
- [docs/agent-ref/ops/ci-cd.md](./docs/agent-ref/ops/ci-cd.md)
- [infra/azure/container-apps/README.md](./infra/azure/container-apps/README.md)
- `#1483`
