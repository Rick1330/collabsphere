# PRJ-02 Next.js App Router Foundation (`#1508`)

## Purpose / Big Picture
- Replace the `apps/web` placeholder static source-of-truth with a real Next.js App Router application foundation.
- Keep Vercel as the web deployment target while updating local dev, build, CI, and deploy contracts so they reflect the new runtime truth.
- Stop at platform foundation: route/layout architecture, minimal accessible placeholders, and truthful runtime/deploy changes. Do not widen into downstream PRJ-02 feature stories.

## Progress
- Done:
  - Rechecked live state for `#1508`, `#1507`, `#2`, `#620`, and open PRs.
  - Reviewed the current placeholder web contract in `apps/web`, `vercel.json`, CI/deploy workflows, and the PRJ-02 route/layout specs.
  - Chose the platform-transition contract: build a real Next.js App Router app in `apps/web`, deploy it to Vercel from the app directory, and remove the hand-staged static-placeholder source-of-truth.
  - Replaced the placeholder `apps/web` source-of-truth with a real Next.js App Router foundation under `src/app`, including public, authenticated global, workspace, and admin route/layout scaffolding.
  - Updated package/runtime validation contracts (`package.json`, `apps/web/package.json`, `apps/web/tsconfig.json`, `eslint.config.mjs`) so root lint/typecheck/dev/build truthfully include the new web app.
  - Updated deployment truth by moving Vercel config into `apps/web/vercel.json`, deleting the retired static-web build helper, and changing deploy workflow web steps to run from `apps/web` while backend artifacts remain the only uploaded download/stage artifacts.
  - Updated repo/docs/AGENTS references that would otherwise keep claiming the retired placeholder surface was current truth.
  - Ran dependency refresh and the required validation commands through successful final passes.
  - Added a deny-by-default protected-route boundary for the non-public namespaces so `/dashboard`, `/workspaces`, `/settings`, `/w/:workspaceId/*`, and `/admin/*` redirect to `/login` before protected UI renders.
  - Implemented the protected-route boundary with a shared path classifier plus Next middleware, and added unit coverage for route classification, redirect construction, and middleware behavior.
  - Cleared the remaining auth-boundary review blockers so the PR head is clean on checks and current-head review threads.
- In progress:
  - Await final merge recheck and squash merge.
- Blocked:
  - None currently.
- Next:
  - Merge `#1510` once the final live recheck remains clean.

## Surprises & Discoveries
- The current deploy workflow uploads and restages `apps/web/dist`, but the deploy job already rebuilds web for Vercel separately; only backend artifacts truly need download/restaging.
- The repo-wide ESLint config does not currently lint `apps/**/src/**/*.ts` / `tsx`, so the web transition needs a small lint-scope correction to keep `pnpm lint` meaningful.
- `apps/web/dist/index.html` is not tracked, but `apps/web/src/index.html` and `apps/web/src/dev.ts` are tracked and therefore must be explicitly removed to avoid stale source-of-truth.
- Running `pnpm --filter @collabsphere/web run build` in parallel with root `pnpm build` caused a transient `.next` output race (`ENOENT` while renaming `500.html`). Serial validation is required when recording package-level and repo-level build evidence.
- `next build` auto-added `allowJs` and `exclude: ["node_modules"]` to `apps/web/tsconfig.json`; keeping those explicit in-repo avoids repeat dirtying during later validation runs.
- The official Next ESLint plugin still emitted a root-level detection warning during `next build`; the cleanest repo-truth fix was to keep root lint authoritative and disable duplicate Next lint during build via `ignoreDuringBuilds`.

## Decision Log
- Decision: Implement the new web runtime as a real Next.js App Router app under `apps/web/src/app`.
  - Rationale: This matches the corrected PRJ-02 architecture direction and truthfully establishes the route/layout foundation downstream stories need.
  - Alternatives: Keep the static placeholder; partially wrap the placeholder in React without changing the actual runtime.
  - Source (spec/domain/agent-ref): `docs/spec/07-architecture/07.6-adrs.md`, `docs/spec/03-information-architecture/03.1-app-structure.md`, `#1508`
- Decision: Keep Vercel as the deploy target, but stop treating `apps/web/dist` as the authoritative web deploy artifact.
  - Rationale: The problem was the placeholder web surface, not the host. Vercel can deploy the real Next app directly from `apps/web`.
  - Alternatives: Preserve the static-artifact contract; move the frontend away from Vercel.
  - Source (spec/domain/agent-ref): `DEPLOYMENT.md`, `docs/agent-ref/ops/deployment.md`, `#1508`
- Decision: Stay foundation-only for UI scope.
  - Rationale: This baton must establish truthful architecture and route shells without pretending the PRJ-02 story chain is already implemented.
  - Alternatives: Build feature-complete marketing/app-shell screens now.
  - Source (spec/domain/agent-ref): `docs/spec/03-information-architecture/03.2-route-map.md`, `docs/agent-ref/ui/page-states.md`, `#1508`
- Decision: Enforce protected namespaces with a deny-by-default login redirect until real session and RBAC wiring lands.
  - Rationale: Non-public route groups cannot remain publicly renderable, but full auth/session product delivery is outside `#1508`.
  - Alternatives: Leave protected placeholders public; widen into full auth/session implementation.
  - Source (spec/domain/agent-ref): `apps/web/AGENTS.md`, `docs/agent-ref/ui/routes.md`, `#1508`

## Outcomes & Retrospective
- Intended outcome:
  - `apps/web` is a real Next.js App Router application with public/global/workspace/admin context scaffolding.
  - Local dev/build and Vercel deploy contracts reflect the new runtime truth.
  - Docs/rules no longer describe `src/index.html` as the current frontend source-of-truth.
- Delivered so far:
  - The platform-transition contract is implemented, validated, and protected namespaces are no longer publicly renderable.
- Deferred:
  - PRJ-02 feature stories `#29`-`#38`
  - final visual-direction/polish work
  - shared UI package extraction unless the implementation proves it is necessary
  - real session retrieval, membership-aware workspace authorization, and admin-role differentiation beyond the deny-by-default protected-route redirect

## Context and Orientation
- Current placeholder sources:
  - `apps/web/src/index.html`
  - `apps/web/src/dev.ts`
  - `scripts/build-static-web-app.ts`
- Current runtime/deploy contract files:
  - `apps/web/package.json`
  - `apps/web/vercel.json`
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy.yml`
  - `scripts/dev.ts`
- Canonical architecture/context refs:
  - `docs/spec/07-architecture/07.2-tech-stack.md`
  - `docs/spec/07-architecture/07.4-repo-organization.md`
  - `docs/spec/07-architecture/07.6-adrs.md`
  - `docs/spec/03-information-architecture/03.1-app-structure.md`
  - `docs/spec/03-information-architecture/03.2-route-map.md`
  - `docs/agent-ref/ui/routes.md`
  - `docs/agent-ref/ui/page-states.md`
  - `docs/agent-ref/ui/responsive-rules.md`
  - `docs/agent-ref/ui/accessibility.md`

## Plan of Work
- Milestone 1: Land a truthful Next.js App Router foundation in `apps/web`.
  - Acceptance: `apps/web` builds with Next.js App Router entry files and no longer relies on `src/index.html` / `src/dev.ts`.
- Milestone 2: Update local dev/build/deploy contracts to match the new web runtime.
  - Acceptance: package scripts, Vercel config, and affected workflow steps reflect the Next-based web contract without wider infra churn.
- Milestone 3: Reconcile docs/rules and validate the transition.
  - Acceptance: docs/rules mention the implemented Next foundation truthfully, and required validation commands pass.

## Concrete Steps
1. Remove the placeholder web source files and add the minimal Next.js App Router file set.
2. Update `apps/web` package/TypeScript/runtime config and any root lint/typecheck contract that would otherwise ignore the new app source.
3. Update Vercel/CI/deploy assumptions only where the new Next foundation requires it.
4. Update the affected docs and `apps/web` local rules so the runtime truth is no longer stale.
5. Run validation and fix only transition-scope regressions.
6. Open the `#1508` PR with exact deferred-work boundaries.

## Validation and Acceptance
- Commands:
  - `pnpm install --frozen-lockfile`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm --filter @collabsphere/web run build`
  - `pnpm build`
  - local web dev startup probe if feasible
- Expected outcomes:
  - The new web app builds as Next.js App Router.
  - Lint/typecheck include the new web source.
  - Deploy workflow no longer assumes `apps/web/dist` is the web source-of-truth.

## Idempotence and Recovery
- Safe retry steps:
  - Re-run the live issue/PR checks and `git diff --name-only` to confirm this baton is still on `#1508`.
  - Re-read this ExecPlan and the PRJ-02 route/layout docs before resuming.
- Rollback steps (if applicable):
  - Revert only the `#1508` branch changes if the Next.js transition proves incompatible with the existing Vercel contract.
- Resume instructions:
  - Start from this ExecPlan, inspect `git status --short`, then validate `apps/web/package.json`, `apps/web/vercel.json`, and `.github/workflows/deploy.yml`.

## Interfaces and Dependencies
- APIs touched:
  - GitHub issues/PRs via `gh`
- Events emitted:
  - None
- Schema changes:
  - None
- External deps:
  - Next.js / React dependency additions in `apps/web`
  - potential workflow/runtime dependency on Vercel CLI execution from `apps/web`

## Artifacts and Notes
- Baton branch: `feature/1508-nextjs-app-router-foundation`
- Parent project: `#2`
- Validation gate remains blocked on this prerequisite: `#620`
