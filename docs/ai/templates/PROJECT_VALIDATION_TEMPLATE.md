# Project Validation Template

## Project
- ID: `<ProjectID>`
- Title: `<Project Title>`

## Labels
- `type:validation`
- `role:validate`
- `spec:project-validation`
- `gate:project-validation`
- `router:ops`
- `review:elevated`
- Additional: `<label>`

## Child Stories
- [ ] `<StoryID> — <title>`
- [ ] `<StoryID> — <title>`

## Success Metrics
- `<metric>` — `<target>`
- `<metric>` — `<target>`

## Exit Criteria
- `<criterion>` — `<pass/fail/evidence>`
- `<criterion>` — `<pass/fail/evidence>`

## Validation Categories
- [ ] functional-readiness
- [ ] performance-readiness
- [ ] security-readiness
- [ ] operational-readiness
- [ ] downstream-readiness
- [ ] contributor-readiness

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

## Evidence / Results
- Logs:
- Screenshots:
- Links:

## Final Readiness Decision
- `<ready|ready_with_caveats|not_ready>`
- Rationale:

## Done When
- [ ] All child stories validated.
- [ ] Exit criteria verified with evidence.
- [ ] Validation categories complete or explicitly waived with rationale.
- [ ] Final readiness decision recorded.
- [ ] Handoff completed.

## Handoff
- Summary:
- Validation evidence:
- Risks / follow-ups:

## References
- `AGENTS.md`
- `docs/agent-ref/ops/*`
