# Label Application Guide V2

## Purpose
Define how the expanded label taxonomy should be applied at the Project, Story, Task, and Validation Artifact levels.

## Label Taxonomy (Expanded)
- `type:*`
- `priority:*`
- `area:*`
- `spec:*`
- `role:*`
- `tier:*`
- `tool:*`
- `risk:*`
- `collab:*`
- `cc:*`
- `review:*`
- `gate:*`
- `exec:*`
- `continuity:*`
- `budget:*`
- `recovery:*`
- `dep:*`
- `status:*`

## Project-Level Label Guidance
Required:
- `type:epic`
- `priority:P0|P1|P2|P3`
- `area:<primary area(s)>`
- `status:<backlog|planned|in_progress|blocked|done>`

Optional (use when relevant):
- `risk:*` for high-risk projects.
- `review:*` for release or security gates.
- `exec:*` if the project has heavy ExecPlan expectations.
- `gate:project-validation` to reflect final validation artifact requirement.

## Story-Level Label Guidance
Required:
- `type:story`
- `priority:P0|P1|P2|P3`
- `area:<1–2 primary areas>`

Recommended:
- `tier:<A|B|C|S>` (planned mix)
- `risk:*` for security/isolation/collab/data/migration/perf/ops risks
- `review:*` when elevated or critical review is expected
- `exec:<execplan|kernel|mixed>`
- `spec:*` to tie to canonical spec sections

Optional:
- `tool:*` for preferred tooling/agent routing
- `collab:*` for realtime/collab critical work
- `dep:*` when upstream dependencies are gating
- `continuity:*` for multi-session or handoff-heavy stories

## Task-Level Label Guidance
Required:
- `type:task`
- `priority:P0|P1|P2|P3`
- `area:*`
- `tier:<A|B|C|S>`

Recommended:
- `exec:execplan` for tier:S tasks
- `review:<standard|elevated|critical>`
- `risk:*` for high-risk changes
- `spec:*` for spec traceability (avoid generic `spec:ui` when a more specific frontend specialization applies)
- `tool:*` for routing

Optional:
- `collab:*`, `cc:*`, `dep:*`, `budget:*`, `recovery:*`, `continuity:*`, `status:*`

## Validation Artifact Label Guidance
Story validation task:
- `type:validation`
- `role:validate`
- `spec:story-validation`
- `gate:story-validation`
- `tier:<A|B|C>` (based on story risk)
- `review:<standard|elevated>` (if required)

Project validation artifact:
- `type:validation`
- `role:validate`
- `spec:project-validation`
- `gate:project-validation`
- `tier:<B|C>` (based on project scope)
- `review:<elevated|critical>` (if required)

Note: Do not use `type:story-validation` or `type:project-validation`. Use `type:validation` with `spec:*` and `gate:*` instead.

## AI Routing Labels (Guidance)
- Use `tool:*` to indicate preferred agent/toolchain.
- Use `tier:*` + `risk:*` + `exec:*` to drive routing into ExecPlan vs kernel execution.
- Use `collab:*` and `area:*` to route to collab-specialized agents.
 - `tool:*` refers to the execution agent/tool, not the framework/library.
 - Default frontend implementation tasks: `tool:cursor`.
 - Use `tool:v0` only for UI generation/layout-heavy tasks.
 - Use `tool:kombai` only for Figma-fidelity/design-to-code tasks.
 - Use `tool:copilot` only when explicitly intended as the primary executor.
 - Do not use `tool:nextjs`, `tool:react`, or `tool:web`.

## Frontend Spec Precision (Guidance)
Avoid the generic `spec:ui` when a more specific specialization is known. Prefer:
- `spec:nextjs-page` for page/route work.
- `spec:react-component` for reusable components.
- `spec:react-form` for form flows.
- `spec:data-hooks` for TanStack Query hooks/state wiring.

## Notes
- Apply labels consistently across levels to reduce routing ambiguity.
- Labels should not replace explicit metadata in V2 templates; they reinforce it.
