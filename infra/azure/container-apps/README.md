# Azure Container Apps backend assets

## Purpose
- Define the backend deployment asset shape for CS-008 on Azure Container Apps.
- Keep `api`, `collab`, and `worker` as separate OCI-compatible services in the same managed environment.
- Make the pre-revision migration hook explicit without pulling CI/workflow automation into this task.

## Files
- `api.containerapp.yaml`
- `collab.containerapp.yaml`
- `worker.containerapp.yaml`
- `migrations.job.yaml`

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
- The service images should come from the existing bootstrap build surface (`apps/<service>/dist`) so the same images remain portable to another OCI host later.
- The backend Docker build copies that staged `dist` bundle directly, including any vendored runtime dependencies under `dist/node_modules`, instead of re-resolving dependencies inside the image build.
- Secret values are not committed here; the manifests reference secret names that must exist in the target Container App or deployment pipeline context.
- The S3 credential references intentionally stay as deployment-time placeholders (`__S3_AUTH_ID_REF__`, `__S3_AUTH_VALUE_REF__`) so source control does not hard-code environment-specific credential identifiers.
- The deploy workflow supplies those S3 secret-name placeholders through GitHub environment variables `AZURE_S3_AUTH_ID_REF` and `AZURE_S3_AUTH_VALUE_REF`.

## Migration and revision-hook strategy
- Run the Container Apps job in `migrations.job.yaml` before updating any backend service revision.
- The migration job is the release hook for schema changes. It must finish successfully before the new `api`, `collab`, or `worker` image tag is applied.
- The job image is rendered during deploy with the current release tag. The current workflow points `__MIGRATIONS_IMAGE__` at `collabsphere-api` so the job and backend rollout stay on the same release artifact until a dedicated migrations image is introduced.
- Service manifests use `activeRevisionsMode: Single` so the latest ready revision becomes active after the migration hook succeeds.

## Manual validation
- Parse each YAML file before use.
- Build the three backend bootstrap artifacts to confirm the image contract still matches the current repo packaging:
  - `pnpm --filter @collabsphere/api run build`
  - `pnpm --filter @collabsphere/collab run build`
  - `pnpm --filter @collabsphere/worker run build`
