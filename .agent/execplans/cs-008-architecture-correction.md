# CS-008 Deployment Architecture Correction

## Purpose / Big Picture
- Replace the stale CS-008 Railway deployment target with the current architecture direction: `web` stays on Vercel, while `api`, `collab`, and `worker` target Azure Container Apps.
- Make the queue truthful before any further CS-008 implementation work resumes.
- Separate the compute/runtime decision from the object-storage decision so Cloudflare R2 can remain deferred.

## Progress
- Done:
  - Confirmed live GitHub backlog, validation issue, and `PRJ-01.yaml` still encode Railway.
  - Reviewed canonical deployment spec, agent-ref deployment guidance, product constraints, and ADR index.
  - Confirmed no existing open issue already tracks the CS-008 architecture correction.
- In progress:
  - Updating canonical repo docs and queue metadata to remove Railway as the active backend target.
  - Drafting an ADR that formalizes Azure Container Apps as the preferred managed backend runtime with container portability preserved.
- Blocked:
  - None inside this planning cycle.
- Next:
  - Sync GitHub issues `#28`, `#228`-`#233`, and `#599` to match the corrected architecture.
  - Open the docs/queue correction PR and link it from the affected issues.

## Surprises & Discoveries
- Story `#28`, task `#228`, validation `#599`, and `.github/queue/projects/PRJ-01.yaml` still describe a Vercel + Railway deployment even after the user-directed architecture change.
- The canonical deployment spec and agent-ref docs are the only repo docs still mentioning Railway directly.
- Product constraints in `docs/spec/01-product-vision/01.9-constraints.md` still bias toward free-tier/VPS hosting, which conflicts with choosing Azure Container Apps as the preferred managed backend target unless cost control and portability are stated explicitly.
- Current repo reality for `apps/web` is a static artifact deployed from `apps/web/dist`, not a Next.js-specific runtime surface.

## Decision Log
- Decision: Keep `web` on Vercel and formalize Azure Container Apps as the preferred managed runtime for `api`, `collab`, and `worker`.
  - Rationale: The current web output is already Vercel-friendly, while the backend requires long-lived containerized services, health checks, and shared environment configuration across `api`, `collab`, and `worker`.
  - Alternatives: Keep Railway as the backend target; use Cloudflare Workers as the primary backend runtime; keep the backend target unspecified.
  - Source (spec/domain/agent-ref): `docs/spec/14-devops/14.6-deployment-strategy.md`, `docs/agent-ref/ops/deployment.md`, `docs/spec/07-architecture/07.6-adrs.md`
- Decision: Require OCI/container portability so DigitalOcean remains a viable fallback host later.
  - Rationale: The managed-runtime decision should not force a proprietary backend packaging model.
  - Alternatives: Optimize exclusively for Azure-specific deployment assets.
  - Source (spec/domain/agent-ref): `docs/spec/01-product-vision/01.9-constraints.md`, `docs/spec/14-devops/14.6-deployment-strategy.md`
- Decision: Defer the object-storage provider decision; keep Cloudflare R2 as a future candidate instead of part of the immediate migration.
  - Rationale: CS-008 is about runtime/deployment orchestration, not object storage.
  - Alternatives: Fold storage-provider migration into this replan.
  - Source (spec/domain/agent-ref): `docs/spec/07-architecture/07.6-adrs.md`, `docs/spec/14-devops/14.6-deployment-strategy.md`
- Decision: Replan the queue first and block stale CS-008 tasks until the corrected source-of-truth PR is merged.
  - Rationale: A "ready" Railway task would be a false next action.
  - Alternatives: Leave stale tasks ready; silently reinterpret `#228` during implementation without correcting the queue.
  - Source (spec/domain/agent-ref): `.agent/PLANS.md`, `.github/queue/projects/PRJ-01.yaml`

## Outcomes & Retrospective
- This cycle delivers the planning and documentation correction required to unblock truthful CS-008 execution.
- It does not implement Azure deployment assets or restart downstream CS-008 implementation.
- Follow-up execution should begin only after the corrected queue/ADR PR is merged and the next active task is reactivated against the new architecture.

## Context and Orientation
- Canonical deployment spec: `docs/spec/14-devops/14.6-deployment-strategy.md`
- Canonical constraints: `docs/spec/01-product-vision/01.9-constraints.md`
- Canonical ADR index: `docs/spec/07-architecture/07.6-adrs.md`
- Engineering deployment guidance: `docs/agent-ref/ops/deployment.md`
- Queue source of truth: `.github/queue/projects/PRJ-01.yaml`
- GitHub backlog surfaces to sync: `#28`, `#228`, `#229`, `#230`, `#231`, `#232`, `#233`, `#599`

## Plan of Work
- Milestone 1: Record the architecture decision in repo docs and ADRs.
  - Acceptance: Deployment spec, agent-ref, constraints, and ADR references no longer encode Railway as the preferred backend target.
- Milestone 2: Replan the queue source of truth.
  - Acceptance: `PRJ-01.yaml` describes CS-008 against Vercel + Azure Container Apps, not Railway.
- Milestone 3: Reconcile live GitHub issues.
  - Acceptance: `#228` is no longer a truthful ready Railway task, `#599` no longer validates Railway, and `#28` references the correction factually.

## Concrete Steps
1. Update deployment spec and agent-ref guidance to formalize the new hosting direction.
2. Add an ADR covering the compute/runtime decision and deferred storage decision.
3. Update product constraints to reflect cost-controlled managed hosting plus container portability.
4. Patch the CS-008 section of `PRJ-01.yaml`.
5. Create a dedicated architecture-correction issue if none exists.
6. Sync affected GitHub issue titles, bodies, and statuses to a blocked/replanned state.
7. Validate the changed docs/queue surfaces and open a PR.

## Validation and Acceptance
- Commands:
  - `Select-String -Path docs/spec/14-devops/14.6-deployment-strategy.md,docs/agent-ref/ops/deployment.md,docs/spec/01-product-vision/01.9-constraints.md,docs/spec/07-architecture/07.6-adrs.md,docs/domains/architecture/adrs.md,.github/queue/projects/PRJ-01.yaml -Pattern "Railway|Azure Container Apps|DigitalOcean|Cloudflare R2|Vercel"`
  - `gh issue view 28 --json title,body,labels,url`
  - `gh issue view 228 --json title,body,labels,url`
  - `gh issue view 599 --json title,body,labels,url`
- Expected outcomes:
  - Repo docs reflect the Vercel + Azure Container Apps direction with Railway removed from the active CS-008 target.
  - Live GitHub issue text no longer presents Railway as the executable next step.

## Idempotence and Recovery
- Safe retry steps:
  - Re-run the `Select-String` validation to confirm the same drift remains resolved after any interruption.
  - Re-open the created architecture-correction issue and linked GitHub issue bodies to continue body sync.
- Rollback steps (if applicable):
  - Revert only the specific doc/queue correction commit if the architecture direction changes again.
- Resume instructions:
  - Read this ExecPlan, the linked ADR, and the CS-008 issue bodies before resuming implementation work.

## Interfaces and Dependencies
- APIs touched:
  - GitHub issue metadata via `gh issue edit`
- Events emitted:
  - None
- Schema changes:
  - None
- External deps:
  - Official hosting/runtime guidance for Azure Container Apps and Cloudflare Workers reviewed during the decision cycle

## Artifacts and Notes
- Planned architecture-correction issue: create if no open tracker exists
- Affected story/task chain: `#28`, `#228`-`#233`, `#599`
- Blocked task to revisit after correction merges: `#228`
