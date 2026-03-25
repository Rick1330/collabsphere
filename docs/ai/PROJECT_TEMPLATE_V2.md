# Project Template V2 — <Project Title>

## Metadata
| Field | Value |
|---|---|
| Project ID | `<ProjectID>` |
| Title | `<Project Title>` |
| Phase | `<foundation|core|collab|extended|hardening|custom>` |
| Priority | `<priority:P0|P1|P2|P3>` |
| Status | `<status:backlog|planned|in_progress|blocked|done>` |
| Lead | `<name or team>` |
| Due | `<YYYY-MM-DD or milestone>` |
| Estimate | `<total hours or story points>` |

## Labels (Expanded Taxonomy)
- `type:epic`
- `priority:<P0|P1|P2|P3>`
- `area:<primary area(s)>`
- `risk:<risk label(s)>`
- `review:<standard|elevated|critical>`
- `exec:<execplan|kernel|mixed>`
- `gate:<project-validation>`
- `status:<backlog|planned|in_progress|blocked|done>`
- Optional: `tool:*`, `collab:*`, `cc:*`, `continuity:*`, `budget:*`, `recovery:*`, `dep:*`

## AI Delivery Metadata
- Phase: `<phase>`
- Execution profile: `<build-heavy|integration-heavy|infra-heavy|collab-critical|security-critical|mixed>`
- Primary risk areas: `<security|isolation|collab|data|migration|performance|ops>`
- Likely tier:S stories: `<list or none>`
- Primary tooling bias: `<api|web|collab|worker|db|infra|ops>`
- Expected routing focus: `<agent/tool routing hints>`

## Vision & Outcomes
- Vision:
- Outcomes:

## Success Metrics
- [ ] `<metric>`
- [ ] `<metric>`

## Canonical References (V2)
- Primary (spec): `<docs/spec/...>`
- Secondary (agent-ref): `<docs/agent-ref/...>`

## Execution References
- `AGENTS.md`
- `.agent/PLANS.md` (for ExecPlan stories/tasks)
- `docs/agent-ref/*`

## Architectural Context
- `<key architecture constraints, boundaries, or invariants>`

## Risks / Mitigations
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| `<risk>` | `<impact>` | `<likelihood>` | `<mitigation>` |

## Dependencies
- Upstream: `<projects or systems>`
- Downstream: `<projects or systems>`

## Story Generation Guidance
- Story grouping guidance: `<feature slices, domains, or layers>`
- Expected routing mix: `<api/web/collab/worker/db>`
- ExecPlan triggers: `<criteria for tier:S stories>`
- Validation expectations: `<story validation focus>`

## Stories
- [ ] `<StoryID> — <title> — <size/estimate> — <tier mix> — <risk>`
- [ ] `<StoryID> — <title> — <size/estimate> — <tier mix> — <risk>`

## Project Validation
- Required final artifact: `PRJ-<ProjectID>-VALIDATE`
- Validation focus: `<functional|performance|security|operational|downstream|contributor>`
- Gate labels: `type:validation`, `role:validate`, `spec:project-validation`, `gate:project-validation`

## Totals
- Stories: `<count>`
- Planned Tasks (derived): `<count>`
- Total Planned Hours: `<hours>`

## Exit Criteria
- [ ] All stories complete.
- [ ] Project validation artifact complete with evidence.
- [ ] Critical risks mitigated or explicitly accepted.
- [ ] Downstream readiness verified.
- [ ] Stakeholder sign-off recorded.
