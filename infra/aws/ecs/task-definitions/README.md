# ECS Task Definitions

These templates define the intended production runtime contract for ECS/Fargate.

Why they exist in source control:

- the deploy workflow should update existing ECS services, not invent the service shape on the fly
- the production environment needs a reviewable contract for CPU/memory, ports, log groups, and runtime secrets
- `api`, `collab`, and `worker` do not share the exact same environment surface, so each task definition is explicit

## Files

- `api.task-definition.json`
- `collab.task-definition.json`
- `worker.task-definition.json`

## Placeholder model

These files are templates, not directly registerable JSON. Replace placeholders such as:

- `__AWS_REGION__`
- `__ECS_EXECUTION_ROLE_ARN__`
- `__ECS_TASK_ROLE_ARN__`
- image placeholders such as `__API_IMAGE__`
- secret placeholders such as `__DATABASE_URL_SECRET_ARN__`

The intended bootstrap sequence is:

1. provision the network, load balancer, database, Redis, and IAM roles
2. create the runtime secrets in Secrets Manager or SSM Parameter Store
3. render these task definitions with the real values
4. register the task definitions and create ECS services
5. hand ongoing image rollouts to `.github/workflows/deploy-production-aws.yml`

## Secret model

Use ECS task `secrets` entries for credentials and connection strings. Do not inline secrets in task definition `environment` arrays.

Expected secret coverage:

- database and Redis URLs
- JWT secret
- email provider key
- collaboration secret and URL inputs where needed
- S3-compatible object storage credentials
- optional `S3_ENDPOINT` for Cloudflare R2

## Notes

- `api` exposes port `3001`
- `collab` exposes port `3002`
- `worker` is internal-only and has no public port mapping requirement
- CPU and memory are conservative defaults and should be revisited with real traffic
