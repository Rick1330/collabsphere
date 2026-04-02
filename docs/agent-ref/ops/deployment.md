# Deployment (agent-ref)

## Purpose
Provide an execution-focused reference for CollabSphere deployment strategy, units, and environment rules.

## Canonical Sources
- `docs/spec/14-devops/14.6-deployment-strategy.md`
- `docs/spec/14-devops/14.3-environments.md`
- `docs/spec/14-devops/14.7-release-process.md`
- `docs/domains/architecture/stack.md`
- `docs/domains/architecture/env-config.md`

## Domain Sources
- `docs/domains/architecture/stack.md`
- `docs/domains/architecture/env-config.md`

## Scope
- Deployment units and topology
- Hosting recommendations (v1)
- Environment segregation rules
- Zero-downtime expectations (v1 scope)
- Release process alignment

## Required Rules / Contract

### Deployment Units (MUST)
- `web` deployed separately.
- `api`, `collab`, `worker` deployed together on a shared network.

### Recommended v1 Hosting
- Frontend (`web`): Vercel serving the deployable `apps/web/dist` artifact.
- Backend services (`api`, `collab`, `worker`): Azure Container Apps as the preferred managed runtime.
- Backend portability: keep backend services packaged as OCI-compatible containers so another host such as DigitalOcean remains viable without a runtime rewrite.
- Database: managed Postgres selected separately from the compute runtime.
- Redis: managed Redis selected separately from the compute runtime.
- Object storage: not part of the immediate CS-008 runtime migration; keep the storage interface S3-compatible and treat Cloudflare R2 as a deferred option.
- Backend asset shape: see `infra/azure/container-apps/` for the current ACA service manifests and migration-job hook contract.

### Environment Rules
- Separate configs for Local, Staging, Production.
- `.env.local` must never be committed.
- `.env.example` must be committed and kept in sync.
- Secrets stored in CI/CD secret stores for staging/prod.

### Zero-downtime (v1 scope)
- Not required for v1.
- Recommended: rolling revisions for containerized backend services.
- Run the migration job before promoting a new backend service revision.
- Collab server reconnect must be handled by clients.

## Edge Cases / Failure Modes
- Inconsistent env vars between `api` and `collab` can break realtime auth/room joins.
- Collab restarts must not cause data loss if persistence is functioning.
- Misconfigured OAuth redirect URLs can break auth flows after deployment.

## Validation or Testing Notes
- Verify all deployment units can access Postgres and Redis in the target environment.
- Confirm `api`, `collab`, `worker` share required secrets and network connectivity.
- Validate production/staging env vars are injected from CI/CD (not committed).

## Related Files / Domains
- `docs/agent-ref/ops/env-vars.md`
- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/ops/deployment-observability.md`
- `docs/agent-ref/ops/release-readiness.md`
- `docs/agent-ref/ops/local-dev.md`
- `infra/azure/container-apps/README.md`
- `docs/agent-ref/rules/security-rules.md`


