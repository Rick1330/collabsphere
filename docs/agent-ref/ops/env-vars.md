# Environment Variables (agent-ref)

## Purpose
Provide an execution-focused reference for environment variable conventions, required secrets, and environment-specific rules.

## Canonical Sources
- `docs/spec/14-devops/14.3-environments.md`
- `docs/spec/14-devops/14.2-local-dev-environment.md`
- `docs/spec/14-devops/14.6-deployment-strategy.md`
- `docs/domains/architecture/env-config.md`

## Domain Sources
- `docs/domains/architecture/env-config.md`

## Scope
- Environment types (local, staging, production)
- `.env` file rules and secrets handling
- Required environment variable categories
- Deployment unit expectations for shared env config

## Required Rules / Contract

### Environment Types
- **Local**: developer machine
- **Staging**: shared test environment
- **Production**: public environment

### `.env` Rules (MUST)
- `.env.local` must **never** be committed.
- `.env.example` must be committed and kept in sync.
- Secrets are stored in:
  - GitHub Actions secrets (staging/prod)
  - Local `.env` for developer machines

### Required Variable Categories
The following categories must be defined for all non-public environments:

1. **Database**
   - Postgres connection string or discrete host/user/password/db settings.

2. **Redis**
   - Redis connection string.

3. **Auth & Security**
   - JWT signing secret(s).
   - OAuth client ID/secret (if OAuth enabled).
   - Cookie/session secrets.

4. **Collaboration**
   - Hocuspocus service URL and any shared auth secrets.

5. **Storage**
   - S3/MinIO credentials and bucket settings (if files enabled).

6. **Email**
   - SMTP or email provider API credentials (if email enabled).

7. **App URLs**
   - Public app URL(s) for redirects and callbacks.
   - API base URL(s) for service-to-service calls.

### Deployment Units
- `web` has its own environment configuration.
- `api`, `collab`, `worker` are deployed together and must share compatible environment variables (same network and shared secrets where required).

## Edge Cases / Failure Modes
- Missing `.env.local` or invalid secrets can cause partial startup failures (services may boot but fail at runtime).
- Mismatched OAuth redirect URLs will break OAuth flows.
- Inconsistent env values between `api` and `collab` can cause auth or room-authorization failures.

## Validation or Testing Notes
- Validate `.env.example` includes all required keys for local development.
- Verify environment variables are loaded consistently across `api`, `collab`, and `worker`.
- Confirm production/staging secrets are injected via CI/CD and not committed.

## Related Files / Domains
- `docs/agent-ref/ops/local-dev.md`
- `docs/agent-ref/ops/deployment.md`
- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/rules/security-rules.md`


