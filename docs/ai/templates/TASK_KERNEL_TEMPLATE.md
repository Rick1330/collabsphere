# Task Kernel Template

## Metadata
| Field | Value |
|---|---|
| Task ID | `<TaskID>` |
| Title | `<Task Title>` |
| Story | `<StoryID>: <Story Title>` |
| Priority | `<P0|P1|P2|P3>` |
| Tier | `<tier:A|tier:B|tier:C>` |
| Estimated Effort | `<S|M|L>` |
| Status | `<draft|ready|in_progress|blocked|done>` |
| Owner | `<name or team>` |
| Created | `<YYYY-MM-DD>` |
| Updated | `<YYYY-MM-DD>` |

## Labels
- `tier:<A|B|C>`
- `type:task`
- `router:<api|web|collab|worker|db|ui|shared|ops>`
- `review:<none|standard|elevated>`
- Additional: `<label>`

## Chain
- Position: `<#>`
- Needs: `<TaskID list or none>`
- Blocks: `<TaskID list or none>`

## AGENTS.md Directive
- Read `AGENTS.md` and module-specific AGENTS for the target area.

## Spec References
- `<docs/agent-ref/...>`
- `<docs/spec/...>` (only if needed for canonical clarity)

## Objective
- `<single-sentence objective>`

## Task Boundary Guidance
- Prefer **one primary execution surface** and **one dominant specialization** per task (e.g., API endpoint, UI view, worker job, integration test).
- Avoid mixing backend behavior + frontend UI + audit/telemetry in one task unless the change is tiny and inseparable.
- If a task must include a side effect (audit log, event emission), make it explicit in the objective and validation.

## Deliverables
- `<deliverable 1>`
- `<deliverable 2>`

## Files
| Path | Change Type | Owner | Notes |
|---|---|---|---|
| `<path>` | `<add|edit|remove>` | `<team>` | `<why>` |

File-scope rules:
- Prefer exact file paths whenever reasonably inferable.
- Frontend-only exception: a **narrow local wildcard** is acceptable when exact filenames are unknown and the scope is tightly bounded (e.g. `apps/web/src/components/workspaces/*`), with Notes stating filenames may vary.
- Broad wildcards (e.g. `apps/web/src/**`, `apps/api/src/**`, `packages/**`) are not acceptable.

## Implementation Notes
- `<key notes, constraints, or invariants>`
- If the task risks mixing concerns, split into separate tasks or document why a split is worse.

## Constraints
- Workspace isolation: all workspace-owned queries must include `workspace_id`.
- REST must not return collaborative Yjs content.
- Follow response envelope and canonical error codes.
- Follow module AGENTS and `docs/agent-ref` contracts.
- `<task-specific constraints>`

## Validation
Commands:
```bash
<exact command>
```
For local API checks, prefer:
```bash
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
curl -fsS "$API_BASE_URL/api/v1/health"
```
Expected outcomes:
- Positive path: `<expected outcome>`
- Negative path (if security/isolation/rate limits apply): `<expected denial/guard outcome>`
- Manual/UI checks (if applicable): `<what was verified manually>`
- If not run, explain why and risk.

## Done When
- [ ] Deliverables implemented.
- [ ] Validation commands executed or explicitly waived.
- [ ] Errors/envelopes match `docs/agent-ref`.
- [ ] No scope creep beyond listed files.
- [ ] Handoff completed.
- [ ] UI tasks: loading/empty/error/loaded states, accessibility, responsive behavior, and permission-gated states verified (if applicable).

## Handoff
- Summary of changes:
- Validation evidence:
- Open issues / follow-ups:
- Risks or deviations:

## References
- `AGENTS.md`
- `docs/agent-ref/*`
