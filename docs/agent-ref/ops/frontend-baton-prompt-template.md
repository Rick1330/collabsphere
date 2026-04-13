# Frontend Baton Prompt Template

## Purpose
Provide a concise prompt contract for frontend batons that preserves governance, validation, and merge quality without unnecessary token burn.

## Required Sections

### 1. Worktree And Baton
- worktree path
- active issue number and title
- parent story or chain context if relevant

### 2. Minimal Live Baseline
- issue state checks
- existing PR check for the same baton
- git branch freshness check
- only the live checks needed to prove the baton is runnable

### 3. Execution Goal
- one clear sentence describing the user-visible or governance-visible outcome

### 4. Scope
- touched surfaces to prefer
- stale or dead paths to ignore
- explicit in-scope and out-of-scope boundaries

### 5. Decision Rules
- rules specific to the baton
- acceptance-critical behaviors or constraints
- any split-lane guidance if UI and API work are separated

### 6. Validation
- exact required commands
- note when targeted tests are required in addition to repo-wide commands

### 7. Review And Merge Rules
- local CodeRabbit CLI requirement
- PR template requirement
- linked issue closing keyword
- handoff or closure comment requirement
- live merge-readiness based on checks and unresolved current-head review threads only

### 8. Required Report
- target report path or report naming convention for the active workflow
- concise required sections

## Prompt Style Rules
- prefer minimal baseline checks; do not paste large issue bodies when a state check is enough
- prefer real live-tree paths over stale issue file tables
- require concise evidence rather than full CI or CLI dumps unless failure proof matters
- keep markdown clean and copy-pasteable
- do not ask the implementer to hand back the baton while in-scope review cleanup is still executable

## Default Report Sections
1. live baseline reconciliation
2. scope implemented
3. files changed with rationale
4. validation results
5. local CodeRabbit findings and outcomes
6. risks and follow-ups
7. merge-readiness assessment

## Related Files
- `apps/web/AGENTS.md`
- `apps/web/REVIEW.md`
- `docs/agent-ref/ops/pr-review-workflow.md`
