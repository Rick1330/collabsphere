# AWS ECS Production

## Purpose

This directory holds the first-pass AWS production deployment surface for CollabSphere.

Current intent:

- `staging` stays on Azure
- `production` backend moves to AWS
- `web` remains on Vercel

## Target Shape

- `api`, `collab`, `worker` on Amazon ECS Fargate
- PostgreSQL on AWS managed Postgres (`RDS` / `Aurora PostgreSQL`)
- Redis on AWS managed Redis (`ElastiCache`)
- container images in ECR
- GitHub Actions deploys to AWS through OIDC, not long-term AWS keys

## Current Bootstrap Scope

Use `pnpm bootstrap:aws:production` for the first safe AWS foundation pass.

Current bootstrap creates or verifies:

- ECS cluster
- ECR repositories for:
  - `collabsphere-api`
  - `collabsphere-collab`
  - `collabsphere-worker`
- CloudWatch log groups for the three backend services
- task-definition templates live under `task-definitions/` so the runtime contract is reviewable in source control before first-run ECS service creation

The current bootstrap does **not** yet provision:

- ECS services
- ALB / listeners / target groups
- Route53 / ACM / public DNS
- RDS / Aurora PostgreSQL
- ElastiCache
- GitHub Actions OIDC IAM role

That split is intentional. The production deploy workflow is for incremental deploys after the base runtime exists. First-run infrastructure creation must remain explicit and reviewable.

## Defaults

If no env vars are provided, the bootstrap script defaults to:

- region: `eu-central-1`
- ECS cluster: `collabsphere-production`
- ECR repositories:
  - `collabsphere-api`
  - `collabsphere-collab`
  - `collabsphere-worker`
- CloudWatch log groups:
  - `/ecs/collabsphere-production/api`
  - `/ecs/collabsphere-production/collab`
  - `/ecs/collabsphere-production/worker`

## Example

Dry-run:

```bash
pnpm bootstrap:aws:production -- --dry-run
```

Real run:

```bash
AWS_PROFILE=collabsphere-production \
AWS_REGION=eu-central-1 \
pnpm bootstrap:aws:production
```

## Required Follow-Up

Before `.github/workflows/deploy-production-aws.yml` can succeed end-to-end, the following must exist:

- an AWS OIDC role trusted by GitHub Actions for `Rick1330/collabsphere`
- ECS services for `api`, `collab`, `worker`
- production database and Redis endpoints
- production runtime secret model for ECS tasks
- public API base URL / health endpoint
- task definitions rendered from `task-definitions/*.task-definition.json` with environment-appropriate role ARNs, secret ARNs, image URIs, and log groups

## Notes

- `api` and `collab` should share the public ingress strategy cleanly enough to support both REST and collaboration endpoints.
- `worker` remains internal and should not be fronted by the public load balancer.
- Use managed services for PostgreSQL and Redis instead of containerized stateful runtime services.
- Object storage should stay S3-compatible and portable. Cloudflare R2 is acceptable for production if ECS tasks receive the R2 endpoint through `S3_ENDPOINT` and a dedicated R2 access key pair through secrets.
