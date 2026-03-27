# Handoff Format (agent-ref)

## Purpose

Provide the standard handoff comment format for delivery work so the next executor, validator, or reviewer can continue without reconstructing context.

## When To Use

Use a handoff comment for:

- implementation tasks that are merged or ready for review
- story validation issues
- project validation issues
- maintenance work that needs explicit follow-up

## Minimum Handoff Contract

Every handoff should include:

- summary of changes
- validation evidence
- open issues or follow-ups
- risks, waivers, or deviations

## Task Handoff Template

```md
## Handoff

### Summary of changes
- ...

### Validation evidence
- `...`
- `...`

### Open issues / follow-ups
- none

### Risks or deviations
- none
```

## Story Validation Handoff Template

```md
## Handoff

### Story result
- pass | fail | pass_with_caveats

### Evidence
- child tasks checked:
- commands run:
- gaps:

### Follow-ups
- ...

### Closure recommendation
- ready_to_close | not_ready
```

## Project Validation Handoff Template

```md
## Handoff

### Project readiness
- ready | ready_with_caveats | not_ready

### Evidence
- stories validated:
- commands run:
- release blockers:

### Follow-ups
- ...

### Closure recommendation
- ready_to_close | not_ready
```

## Rules

- keep the handoff concise but decision-useful
- do not hide skipped validation
- if a comment rejects a review finding, state why
- if the work is blocked, say exactly what is blocking it
- when a PR merges, automation may sync task issue `Done When` and `Handoff` sections from the merged PR body; keep `Handoff Summary`, `Handoff Validation Evidence`, and `Handoff Risks / Deviations` accurate when those headings are used

## Related Files

- `docs/agent-ref/ops/github-issue-lifecycle.md`
- `docs/agent-ref/ops/pr-review-workflow.md`
