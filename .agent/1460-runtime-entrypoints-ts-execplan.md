# MAINT-1460 Runtime Entrypoints TS Migration

## Purpose / Big Picture
- Migrate app runtime entrypoints from JavaScript to TypeScript without changing bootstrap behavior.
- Keep local dev on `tsx`, keep build artifacts runnable from `dist`, and enforce a TS-first policy for `apps/*/src`.

## Progress
- Done:
  - converted app entrypoints to `dev.ts`
  - updated app package scripts and per-app TS configs
  - preserved bootstrap artifact staging for compiled `dist/dev.js`
  - added ESLint guardrail blocking `.js` under `apps/*/src`
  - fixed Review Router classification by relabeling `#1460` with `type:task`
- In progress:
  - reduce duplicated HTTP bootstrap logic to clear Sonar duplication
  - rerun validation and recheck PR hosted status
- Blocked:
  - PR merge remains blocked until Sonar and Review Router both pass on the latest head
- Next:
  - push the helper extraction
  - recheck `route`, Sonar, and merge state
  - document the router maintenance-label taxonomy mismatch as a follow-up issue if still untracked

## Surprises & Discoveries
- Review Router did not fail due to token/API HTML here; it failed because `#1460` lacked an executable `type:*` label.
- The repo has delivery `type:*` labels (`type:task`, `type:story`, etc.) but not the maintenance `type:*` labels that Review Router appears to expect for maintenance issues.
- Windows subprocess execution is more reliable in tests when `tsx` and `tsc` are invoked via `node` entry scripts instead of `.cmd` wrappers.

## Decision Log
- Decision:
  - Use a small shared bootstrap helper instead of leaving duplicated startup logic in `apps/api`, `apps/collab`, and `apps/web`.
  - Rationale:
    - Sonar duplication is on the entrypoints themselves; moving only test helpers is not enough.
  - Alternatives:
    - accept the duplication and waive Sonar
    - make only cosmetic local changes in each app
  - Source:
    - `AGENTS.md`
    - issue `#1460`
- Decision:
  - Add `type:task` to `#1460` as the pragmatic router unblock.
  - Rationale:
    - the router recognizes executable `type:*` labels and the repo already has `type:task`.
  - Alternatives:
    - redesign router taxonomy first
    - bypass the failing route check
  - Source:
    - live `Review Router / route` failure logs

## Outcomes & Retrospective
- Delivered:
  - TS runtime entrypoints and build/dev flow
  - bootstrap artifact staging preserved for compiled output
  - TS-first lint guardrail
- Remaining:
  - final PR clean state and merge
- Follow-ups:
  - maintenance label taxonomy mismatch for Review Router, if not already tracked

## Context and Orientation
- Relevant files:
  - `apps/api/src/dev.ts`
  - `apps/collab/src/dev.ts`
  - `apps/web/src/dev.ts`
  - `apps/worker/src/dev.ts`
  - `packages/shared/src/bootstrap-runtime.js`
  - `scripts/build-bootstrap-app.mjs`
  - `tests/unit/bootstrap-test-helpers.mjs`
- Constraints:
  - no behavior change
  - built artifacts must not retain monorepo-relative source imports
  - no JS reintroduced under `apps/*/src`

## Plan of Work
- Milestone 1:
  - Outcome: TS entrypoints and build/dev tooling work locally.
  - Acceptance: lint, typecheck, and per-app builds pass.
- Milestone 2:
  - Outcome: duplication reduced enough for Sonar on the entrypoints.
  - Acceptance: shared bootstrap logic extracted with no behavior regressions.
- Milestone 3:
  - Outcome: PR metadata and hosted checks are mergeable.
  - Acceptance: `route` and Sonar both pass on the latest head.

## Concrete Steps
1. Keep the TS migration branch intact and avoid unrelated cleanup.
2. Extract shared HTTP bootstrap behavior into one helper and reuse it in api/collab/web.
3. Keep worker-specific heartbeat behavior local; only share env-validation handling where useful.
4. Update bootstrap artifact staging to copy and rewrite any new shared helper import.
5. Re-run local validation.
6. Recheck GitHub labels/checks and document the router taxonomy follow-up if needed.

## Validation and Acceptance
- Commands:
  - `pnpm lint`
  - `pnpm typecheck`
  - `node --test tests/unit/shared-env.test.mjs tests/unit/api-bootstrap-env.test.mjs tests/unit/collab-worker-bootstrap-env.test.mjs`
  - `pnpm build:api`
  - `pnpm build:collab`
  - `pnpm build:worker`
  - `pnpm build:web`
- Expected outcomes:
  - entrypoints still start and fail fast exactly as before
  - built artifacts remain runnable
  - hosted `route` and Sonar pass after metadata/code fixes

## Idempotence and Recovery
- Safe retry steps:
  - rerun the validation commands above
  - rerun failed GitHub Actions jobs after metadata fixes
- Rollback steps:
  - revert only the helper extraction commit if it introduces behavior drift
- Resume instructions:
  - start from PR `#1461`, branch `maintenance/1460-ts-entrypoints`, and compare latest head to this plan

## Interfaces and Dependencies
- APIs touched:
  - local bootstrap HTTP surfaces only
- Events emitted:
  - none
- Schema changes:
  - none
- External deps:
  - `tsx`
  - `typescript`

## Artifacts and Notes
- Issue: `#1460`
- PR: `#1461`
- Follow-up issue: pending creation if router maintenance-label mismatch is not already tracked
