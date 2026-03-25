# Story Validation Template

## Story
- ID: `<StoryID>`
- Title: `<Story Title>`

## Labels
- `type:validation`
- `role:validate`
- `spec:story-validation`
- `gate:story-validation`
- `router:ops`
- `review:standard`
- Additional: `<label>`

## Child Tasks
- [ ] `<TaskID> — <title>`
- [ ] `<TaskID> — <title>`

## Acceptance Criteria Verification
- `<criterion>` — `<pass/fail/evidence>`
- `<criterion>` — `<pass/fail/evidence>`

## Validation Categories
- [ ] api-contract
- [ ] ui-contract
- [ ] integration
- [ ] realtime
- [ ] permissions
- [ ] edge-cases
- [ ] performance
- [ ] ops

## Validation Steps / Commands
```bash
<exact command>
```
For local API checks, prefer:
```bash
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
curl -fsS "$API_BASE_URL/api/v1/health"
```
Expected outcomes:
- `<expected outcome>`

## Integration Checks
- `<cross-module flow verification>`

## Evidence / Results
- Logs:
- Screenshots:
- Links:

## Done When
- [ ] All child tasks validated.
- [ ] Acceptance criteria verified with evidence.
- [ ] Validation categories complete or explicitly waived with rationale.
- [ ] Integration checks recorded.
- [ ] Handoff completed.

## Handoff
- Summary:
- Validation evidence:
- Risks / follow-ups:

## References
- `AGENTS.md`
- `docs/agent-ref/ops/*`
