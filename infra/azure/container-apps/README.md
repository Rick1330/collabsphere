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
- Secret values are not committed here; the manifests reference secret names that must exist in the target Container App or deployment pipeline context.
- The S3 credential references intentionally stay as deployment-time placeholders (`__S3_AUTH_ID_REF__`, `__S3_AUTH_VALUE_REF__`) so source control does not hard-code environment-specific credential identifiers.

## Migration and revision-hook strategy
- Run the Container Apps job in `migrations.job.yaml` before updating any backend service revision.
- The migration job is the release hook for schema changes. It must finish successfully before the new `api`, `collab`, or `worker` image tag is applied.
- The job intentionally uses a separate `__MIGRATIONS_IMAGE__` placeholder rather than the slim service images. That image must include the migration toolchain and schema artifacts required for `pnpm prisma migrate deploy`.
- Service manifests use `activeRevisionsMode: Single` so the latest ready revision becomes active after the migration hook succeeds.

## Manual validation
- Parse each YAML file before use.
- Build the three backend bootstrap artifacts to confirm the image contract still matches the current repo packaging:
  - `pnpm --filter @collabsphere/api run build`
  - `pnpm --filter @collabsphere/collab run build`
  - `pnpm --filter @collabsphere/worker run build`
