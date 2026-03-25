# Story Template V2 — <Story Title>

## Metadata
| Field | Value |
|---|---|
| Story ID | `<StoryID>` |
| Project | `<Project Title>` |
| Priority | `<priority:P0|P1|P2|P3>` |
| Estimate | `<XS|S|M|L|XL>` |
| Status | `<status:backlog|planned|in_progress|blocked|done>` |
| Owner | `<name or team>` |

## Labels (Expanded Taxonomy)
- `type:story`
- `priority:<P0|P1|P2|P3>`
- `area:<primary area(s)>`
- `spec:<spec tag(s)>`
- `role:<builder|reviewer|validator>`
- `tier:<A|B|C|S>` (planned mix)
- `risk:<risk label(s)>`
- `review:<standard|elevated|critical>`
- `exec:<execplan|kernel|mixed>`
- `collab:<flag if collab-critical>`
- `status:<backlog|planned|in_progress|blocked|done>`
- Optional: `tool:*`, `cc:*`, `gate:*`, `continuity:*`, `budget:*`, `recovery:*`, `dep:*`

## AI Delivery Metadata
- Primary domain: `<auth|workspaces|documents|collab|tasks|comments|notifications|files|search|infra|ops>`
- Execution profile: `<api-heavy|web-heavy|collab-heavy|worker-heavy|db-heavy|mixed>`
- Likely task specializations: `<api|web|collab|worker|db|ui|shared|ops>`
- Likely risk labels: `<security|isolation|collab|data|migration|performance|ops>`
- Likely tier mix: `<A/B/C/S distribution>`
- Expected validation categories: `<api-contract|ui-contract|integration|realtime|permissions|edge-cases|performance|ops>`
- Expected routing/tooling: `<agent/tool routing hints>`

## Canonical References (V2)
- Primary (spec): `<docs/spec/...>`
- Secondary (agent-ref): `<docs/agent-ref/...>`

## Execution References
- `AGENTS.md`
- `.agent/PLANS.md` (if any task is tier:S)
- `docs/agent-ref/*`

## Persona
- `<persona>`

## Problem
- `<problem statement>`

## Scope Boundaries
- In scope:
- Out of scope:

## Architectural Context
- `<key architecture constraints, boundaries, or invariants>`

## Acceptance Criteria
- [ ] `<criterion>`
- [ ] `<criterion>`

## Edge Cases
- [ ] `<edge case>`

## UI / Design
- Figma: `<link or N/A>`
- Key interactions:
- Responsive:

## API Contract
- Endpoints:
- Request/Response:
- Error codes:

## Data / Migration
- DB change required: `<yes/no>`
- Schema impact: `<tables/fields>`
- Migration name: `<name or N/A>`
- Rollback plan:

## Events / Realtime
- Domain events:
- Socket.IO events:
- Collab (Hocuspocus/Yjs) impact:

## Security / RBAC
- Required roles:
- Workspace scoping required: `<yes/no>`
- Ownership checks:

## Tests
- Unit:
- Integration:
- E2E:

## Observability
- Logs:
- Metrics:
- Alerts:

## Task Generation Guidance
- Task kernel candidates: `<list>`
- ExecPlan triggers: `<criteria; identify tier:S tasks>`
- Expected routing per task: `<api/web/collab/worker/db>`
- Boundary rule: split by execution surface; avoid mixed API+UI or behavior+audit in one task unless tiny and inseparable.
- Side effects: call out audit logging, event emission, notifications as **separate tasks** if they are non-trivial.
- Validation: identify **negative-path** checks that must be represented (denials, non-enumeration, rate limits, invalid transitions).
- Validation tasks: must include final story validation task.

## Planned Tasks
1. `<Task summary> (~<hours>)`
2. `<Task summary> (~<hours>)`

## Story Validation
- Required final task: `CS-<StoryID>-VALIDATE`
- Validation focus: `<categories from above>`
- Validation labels: `type:validation`, `role:validate`, `spec:story-validation`, `gate:story-validation`

## Definition of Done
- [ ] All acceptance criteria met.
- [ ] Edge cases handled.
- [ ] Tests passing or explicitly waived with rationale.
- [ ] Story validation task completed with evidence.
- [ ] Docs updated if required.
