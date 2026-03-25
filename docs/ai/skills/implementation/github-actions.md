# GitHub Actions Workflow

## Purpose
Safely modify CI workflows while preserving required checks.

## When to Use
- Updating CI stages, tests, or build steps.

## Required Inputs / Context
- CI requirements and release readiness rules.

## Read First
- `docs/agent-ref/ops/ci-cd.md`
- `docs/agent-ref/ops/release-readiness.md`

## Workflow
1. Preserve required CI stages (lint, typecheck, unit, integration, build).
2. Keep secrets in GitHub Actions secrets (never in repo).
3. Add caching only if it doesn’t break determinism.
4. Ensure migrations/tests have DB/Redis services.

## Dangerous Mistakes
- Removing required checks.
- Leaking secrets.
- Introducing flaky steps without retries.

## Validation Expectations
- Verify workflows run end-to-end on a sample branch.

## Escalation Conditions
- Any change that alters release gating requirements.

## Related Skills / References
- `implementation/docker-compose.md`
- `docs/agent-ref/ops/ci-cd.md`
