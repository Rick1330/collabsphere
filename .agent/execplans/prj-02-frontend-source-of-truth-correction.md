# PRJ-02 Frontend Source-of-Truth Correction and Replan (`#1507`)

## Purpose / Big Picture
- Correct the repo and GitHub source-of-truth so the current `apps/web` placeholder surface is treated as temporary implementation state, not as the intended long-term frontend architecture.
- Preserve the current Vercel deployment truth and current runtime/build behavior while the real frontend transition is still pending.
- Replan PRJ-02 so the next implementation baton is the actual `apps/web` platform transition rather than a feature story that assumes the frontend foundation already exists.

## Progress
- Done:
  - Rechecked live issue state for `#1507`, `#2`, `#29`-`#38`, and `#620`; confirmed the baton was eligible and no open PRs existed.
  - Reviewed the PRJ-02 decision pack, prior architecture/deployment reports, repo AGENTS/docs, and the current placeholder `apps/web/src/index.html` surface.
  - Corrected canonical docs/rules so they now distinguish current placeholder truth, intended Next.js App Router target architecture, and the unchanged Vercel deploy contract.
  - Created follow-up issue `#1508` for the real `apps/web` platform transition because no open issue already covered it cleanly.
  - Synced GitHub continuity for `#2`, `#620`, and backlog stories `#29`-`#38`.
  - Opened PR `#1509` for the source-of-truth correction baton.
- In progress:
  - Address current-head review nits on portable references and wording clarity.
- Blocked:
  - None currently.
- Next:
  - Record final validation evidence.
  - Re-check PR `#1509` review state after the doc-nit follow-up commit.

## Surprises & Discoveries
- The current repo shell still has no `rg` binary installed, so wording audits had to fall back to PowerShell/native file inspection.
- The contradiction is concentrated in a small set of canonical files; the runtime/build/deploy contract itself did not need code changes to become truthful.
- Existing PRJ-02 story bodies mostly describe target-state behavior correctly; the real governance gap was that the project chain lacked an explicit prerequisite issue bridging from the placeholder surface to that target state.

## Decision Log
- Decision: Keep Vercel as the authoritative web deployment target.
  - Rationale: The hosting target is still correct; only the frontend architecture truth was overstated around the placeholder.
  - Alternatives: Re-open hosting choice; reframe PRJ-02 around a non-Vercel target.
  - Source (spec/domain/agent-ref): `DEPLOYMENT.md`, `docs/spec/07-architecture/07.6-adrs.md`, `#1507`
- Decision: Treat the current `apps/web` static surface as temporary implementation truth only.
  - Rationale: This preserves honest docs for current `main` without freezing the architecture around `src/index.html`.
  - Alternatives: Keep the placeholder as the intended final frontend; pretend the Next.js transition is already done.
  - Source (spec/domain/agent-ref): `README.md`, `AGENTS.md`, `apps/web/AGENTS.md`, `docs/spec/07-architecture/07.6-adrs.md`
- Decision: Record the long-term frontend target explicitly as Next.js App Router in `apps/web`.
  - Rationale: PRJ-02 story contracts already assume a real application frontend with app-shell and provider behavior that the placeholder cannot satisfy.
  - Alternatives: Leave the target unspecified; require every future baton to rediscover the same conclusion.
  - Source (spec/domain/agent-ref): `docs/spec/07-architecture/07.2-tech-stack.md`, `docs/spec/07-architecture/07.6-adrs.md`, `#1507`
- Decision: Create exactly one new prerequisite issue, `#1508`, for the actual web-platform transition.
  - Rationale: No existing open issue cleanly covered the transition from placeholder static surface to the real frontend foundation.
  - Alternatives: Reuse `#1507`; jump directly into `#29`-`#38`; leave the follow-up implicit.
  - Source (spec/domain/agent-ref): live `gh issue list`, `#2`, `#620`, `#1507`

## Outcomes & Retrospective
- This baton does not change the web runtime or deploy path; it corrects architecture truth and sequencing so later frontend implementation can proceed honestly.
- Canonical docs/rules now state:
  - current placeholder `apps/web` surface still exists
  - Vercel remains the deployment target
  - long-term target architecture is Next.js App Router
- PRJ-02 now has a concrete next implementation baton in `#1508`.

## Context and Orientation
- Current placeholder implementation: `apps/web/src/index.html`
- Repo-wide rules: `AGENTS.md`
- Web-local rules: `apps/web/AGENTS.md`
- Canonical architecture truth: `docs/spec/07-architecture/07.2-tech-stack.md`, `docs/spec/07-architecture/07.4-repo-organization.md`, `docs/spec/07-architecture/07.6-adrs.md`
- Local/runtime truth: `README.md`, `docs/agent-ref/ops/local-dev.md`, `docs/spec/14-devops/14.2-local-dev-environment.md`
- Deployment truth: `DEPLOYMENT.md`
- GitHub continuity surfaces: `#2`, `#29`-`#38`, `#620`, `#1507`, `#1508`

## Plan of Work
- Milestone 1: Correct canonical repo source-of-truth files.
  - Acceptance: Docs/rules no longer present the placeholder static surface as the intended final frontend architecture, while Vercel remains the web deployment target.
- Milestone 2: Reconcile GitHub project/story/validation continuity.
  - Acceptance: `#2`, `#620`, and the backlog story chain make the prerequisite platform transition explicit instead of implying the placeholder is final architecture.
- Milestone 3: Establish the next real implementation baton and hand off cleanly.
  - Acceptance: A single follow-up issue exists, the `#1507` PR is opened with clean scope/template usage, and validation proves deploy/runtime files stayed untouched.

## Concrete Steps
1. Recheck live issue state, open PR state, and current placeholder web files before editing.
2. Update canonical docs/rules to separate current placeholder truth, target architecture, and current Vercel deployment truth.
3. Create a dedicated follow-up issue if no open issue already covers the actual web-platform transition.
4. Sync project/validation issue bodies and backlog continuity comments to point at the prerequisite transition baton.
5. Validate changed wording and scope containment.
6. Open the `#1507` PR and inspect checks/review state.

## Validation and Acceptance
- Commands:
  - `gh issue view 1507 --json number,title,state,labels,body,url`
  - `gh issue view 2 --json number,title,state,labels,body,url`
  - `gh issue view 620 --json number,title,state,labels,body,url`
  - `gh issue view 1508 --json number,title,state,labels,body,url`
  - `git diff -- AGENTS.md README.md DEPLOYMENT.md apps/web/AGENTS.md docs/spec/07-architecture/07.2-tech-stack.md docs/spec/07-architecture/07.4-repo-organization.md docs/spec/07-architecture/07.6-adrs.md docs/agent-ref/ops/local-dev.md docs/spec/14-devops/14.2-local-dev-environment.md`
  - `git diff --name-only`
  - `git diff --exit-code -- .github/workflows/deploy.yml vercel.json apps/web/package.json scripts apps/web/src/index.html`
- Expected outcomes:
  - Changed docs/rules are limited to source-of-truth correction and sequencing.
  - `DEPLOYMENT.md` still preserves Vercel as the deployment target.
  - Runtime/deploy files outside wording corrections remain untouched.
  - GitHub issue state shows `#1508` as the prerequisite follow-up baton.

## Idempotence and Recovery
- Safe retry steps:
  - Re-run the live issue checks and `git diff` commands to confirm the same correction set is still in progress.
  - Re-read this ExecPlan plus the PRJ-02 decision pack before resuming.
- Rollback steps (if applicable):
  - Revert only the source-of-truth correction commit if architecture direction changes again before merge.
- Resume instructions:
  - Start from this ExecPlan, then inspect `git status --short`, `gh pr list --state open`, and the live issue bodies for `#1507`, `#2`, `#620`, and `#1508`.

## Interfaces and Dependencies
- APIs touched:
  - GitHub issues via `gh issue edit`, `gh issue create`, and `gh issue comment`
- Events emitted:
  - None
- Schema changes:
  - None
- External deps:
  - None beyond GitHub CLI for issue/PR state sync

## Artifacts and Notes
- Follow-up prerequisite issue: `#1508`
- Current baton branch: `feature/1507-prj02-frontend-source-of-truth-correction`
- This baton is documentation/sequencing only; the actual `apps/web` platform transition is intentionally deferred to `#1508`.
