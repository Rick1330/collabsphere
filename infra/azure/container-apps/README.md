# Azure Container Apps backend assets

## Purpose
- Define the backend deployment asset shape for CS-008 on Azure Container Apps.
- Keep `api`, `collab`, and `worker` as separate OCI-compatible services in the same managed environment.
- Make the pre-revision migration hook explicit without pulling CI/workflow automation into this task.
- Keep first-time staging bootstrap separate from normal incremental deploys.

## Files
- `api.containerapp.yaml`
- `collab.containerapp.yaml`
- `worker.containerapp.yaml`
- `migrations.job.yaml`

## Bootstrap boundary
- `deploy.yml` is an incremental deploy workflow, not a zero-to-one environment bootstrap.
- First-time ACA bootstrap must create:
  - the `api`, `collab`, and `worker` container apps
  - the migrations job
  - the runtime secrets referenced by the manifests
- After bootstrap, `deploy.yml`:
  - builds and pushes images
  - renders manifests with environment-specific names and tags
  - updates the migrations job definition
  - runs the migrations job
  - updates the existing backend apps
- If those Azure resources do not exist yet, `deploy.yml` should fail fast with a bootstrap instruction instead of trying to guess first-run state.

## Service shape
- `api`
  - External ingress enabled on port `3001`.
  - Startup and readiness probes call `GET /api/v1/health`.
  - Liveness uses a TCP probe on port `3001` so transient database or Redis failures do not cause restart loops.
- `collab`
  - Internal ingress only on port `3002`.
  - Readiness, liveness, and startup probes call `GET /`.
- `worker`
  - No ingress.
  - Long-running background process with single-revision rollout; health is process-based until a dedicated worker health surface exists.

## Image contract
- Each manifest expects a prebuilt OCI image reference such as `__REGISTRY_SERVER__/collabsphere-api:__IMAGE_TAG__`.
- Each manifest also expects ACR pull auth placeholders:
  - `__ACR_USERNAME__`
  - `passwordSecretRef: acr-password`
- Resource names are rendered at deploy time so the same manifest templates can target staging or future non-default names safely.
- The service images should come from the existing bootstrap build surface (`apps/<service>/dist`) so the same images remain portable to another OCI host later.
- The backend Docker build copies that staged `dist` bundle directly, including any vendored runtime dependencies under `dist/node_modules`, instead of re-resolving dependencies inside the image build.
- Secret values are not committed here; the manifests reference secret names that must exist in the target Container App or deployment pipeline context.
- The S3 credential references intentionally stay as deployment-time placeholders (`__S3_AUTH_ID_REF__`, `__S3_AUTH_VALUE_REF__`) so source control does not hard-code environment-specific credential identifiers.
- The deploy workflow supplies those S3 secret-name placeholders through GitHub environment variables `AZURE_S3_AUTH_ID_REF` and `AZURE_S3_AUTH_VALUE_REF`.
- When object storage uses an S3-compatible non-AWS endpoint such as Cloudflare R2, the manifests can also render an optional `S3_ENDPOINT` secret reference through `AZURE_S3_ENDPOINT_SECRET_REF`.
- The deploy workflow/bootstrap path must also ensure the `acr-password` secret exists before a manifest update so Container Apps can keep pulling private images from ACR.

## Migration and revision-hook strategy
- Run the Container Apps job in `migrations.job.yaml` before updating any backend service revision.
- The migration job is the release hook for schema changes. It must finish successfully before the new `api`, `collab`, or `worker` image tag is applied.
- The job image is rendered during deploy with the current release tag. The current workflow points `__MIGRATIONS_IMAGE__` at `collabsphere-api` so the job and backend rollout stay on the same release artifact until a dedicated migrations image is introduced.
- The migrations job consumes the pre-provisioned `database-url` secret from Azure rather than taking a raw database URL from the deploy workflow.
- The migrations job exits successfully as a no-op only when none of the expected Prisma schema paths are present in the image.
- If a future release artifact includes Prisma schema files, the referenced migrations image must also include the matching migration payload and the `pnpm`/Prisma CLI toolchain required by `pnpm exec prisma migrate deploy`.
- Service manifests use `activeRevisionsMode: Single` so the latest ready revision becomes active after the migration hook succeeds.

## Bootstrap helper
- Use `pnpm bootstrap:aca:staging` for first-run staging ACA creation and secret provisioning.
- Use `pnpm bootstrap:aca:production` for first-run production ACA creation and secret provisioning.
- Use `pnpm bootstrap:aca -- --environment staging|production` when you want to drive the target environment explicitly.
- The helper expects:
  - Azure foundation resources to already exist
  - runtime values to be supplied as environment variables
  - `AZURE_ACR_USERNAME` and `AZURE_ACR_PASSWORD` so first-run create can pull from private ACR
  - an image tag that already exists in ACR, or `--build-and-push` to seed the images first
- Use `--dry-run` to validate manifest rendering and placeholder replacement without mutating Azure.
- The helper provisions secrets on the apps/jobs and creates missing resources before normal `deploy.yml` runs are used.
- The helper does not provision Postgres or Redis. `DATABASE_URL`, `COLLAB_DATABASE_URL`, and `REDIS_URL` should point at managed data services provisioned separately, such as AWS Aurora/RDS and ElastiCache if that is the chosen environment design.
- The helper also does not provision object storage. For Cloudflare R2, provide `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION=auto`, and `S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`.
- Internal service connection strings should use ACA app names inside the environment, not the public-style internal FQDNs:
  - Postgres: `collabsphere-pg-stg:5432`
  - Redis: `collabsphere-redis-stg:6379`

## Scale tuning
- Backend replica counts are environment-configurable through GitHub environment vars or bootstrap env vars:
  - `AZURE_API_MIN_REPLICAS`, `AZURE_API_MAX_REPLICAS`
  - `AZURE_COLLAB_MIN_REPLICAS`, `AZURE_COLLAB_MAX_REPLICAS`
  - `AZURE_WORKER_MIN_REPLICAS`, `AZURE_WORKER_MAX_REPLICAS`
- Default values remain `1`/`1` for each service.
- Keep staging values intentionally low to avoid idle spend; production values should be chosen from actual traffic and worker requirements.

## Manual validation
- Parse each YAML file before use.
- Build the three backend bootstrap artifacts to confirm the image contract still matches the current repo packaging:
  - `pnpm --filter @collabsphere/api run build`
  - `pnpm --filter @collabsphere/collab run build`
  - `pnpm --filter @collabsphere/worker run build`
