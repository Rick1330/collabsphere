# ExecPlan Standard (.agent/PLANS.md)

## 1. Purpose
ExecPlans are living, execution-focused plans for complex work in CollabSphere. They provide a resumable, auditable map from intent → implementation → validation, aligned with the repo’s architecture and safety constraints.

## 2. When to Use an ExecPlan
ExecPlans are **required** for:
- `tier:S` tasks
- `type:execplan`
- multi-hour or multi-session work
- significant refactors or cross-module changes
- risky architectural changes
- anything touching collaboration, security, or workspace isolation
- ambiguous or research-heavy work

## 3. Relationship to Repo Docs
- `docs/spec/` is canonical.
- `docs/domains/` is engineering-oriented.
- `docs/agent-ref/` is execution-oriented.
- If a plan conflicts with `docs/spec/`, **spec wins**. Log the discrepancy and adjust the plan.

## 4. Non-Negotiable Properties of an ExecPlan
Every ExecPlan must be:
- **Self-contained**: can be read and executed without external context.
- **Living**: updated as decisions, discoveries, and progress change.
- **Novice-guiding**: explicit enough for a new contributor to follow safely.
- **Outcome-focused**: ties steps to observable results.
- **Validation-driven**: proves behavior, not just compilation.
- **Resumable**: supports interruption and safe recovery.
- **Explicit** about assumptions, decisions, and constraints.

## 5. Required Sections (Every ExecPlan)
1. **Title**
2. **Purpose / Big Picture**
3. **Progress**
4. **Surprises & Discoveries**
5. **Decision Log**
6. **Outcomes & Retrospective**
7. **Context and Orientation**
8. **Plan of Work**
9. **Concrete Steps**
10. **Validation and Acceptance**
11. **Idempotence and Recovery**
12. **Interfaces and Dependencies**
13. **Artifacts and Notes**

## 6. Progress Rules
- Update progress continuously; no stale “in progress” at session end.
- Every stopping point must show what is done vs remaining.
- Split partial work into **done**, **in-progress**, **blocked**, and **next**.

## 7. Decision Rules
- Log every significant implementation or policy decision.
- Include rationale and alternatives considered.
- If a decision interprets spec, make it explicit and cite the source.

## 8. Surprises Rules
- Record unexpected findings, failure modes, or quirks.
- Pay special attention to Yjs, Hocuspocus, Socket.IO, migrations, and search indexing.

## 9. Milestone Rules
- Milestones must be independently verifiable.
- Each milestone must define observable outcomes.
- Each milestone must include validation and acceptance criteria.
- Milestones are outcome-focused, not just checklists.

## 10. Validation Rules
- Validation is mandatory.
- Include exact commands and expected outcomes.
- Validation must prove **behavior** (not just build success).
- Long-running tasks require milestone-level validation plus final validation.

## 11. Recovery / Failover Rules
ExecPlans must support:
- Agent interruption and resumption.
- Tool switching or handoff between agents.
- Safe retries and rollbacks where relevant.
- A plan that can be executed using only the plan document.

## 12. CollabSphere-Specific Guardrails
ExecPlans must explicitly respect:
- **No REST CRDT content delivery** (document REST is metadata-only).
- **`content_yjs` is canonical**; `content_plaintext` is derived.
- **Workspace isolation** must be explicit in every query/operation.
- **No per-keystroke activity/notification emissions**.
- **Socket.IO vs Hocuspocus are distinct** (app events vs document collaboration).
- **Event-driven side effects** are required (emit domain events, do not shortcut).

## 13. ExecPlan Skeleton (Copy/Paste)
```md
# Title

## Purpose / Big Picture
- What is being changed and why.

## Progress
- Done:
- In progress:
- Blocked:
- Next:

## Surprises & Discoveries
- (Log unexpected findings, quirks, perf issues, library behavior.)

## Decision Log
- Decision:
  - Rationale:
  - Alternatives:
  - Source (spec/domain/agent-ref):

## Outcomes & Retrospective
- What was delivered.
- What remains.
- Follow-ups (if any).

## Context and Orientation
- Relevant modules/files.
- Constraints or risks.
- Links to specs/agent-ref.

## Plan of Work
- Milestone 1 (Outcome + acceptance)
- Milestone 2 (Outcome + acceptance)
- Milestone 3 (Outcome + acceptance)

## Concrete Steps
1. …
2. …
3. …

## Validation and Acceptance
- Commands:
  - `...`
- Expected outcomes:
  - …

## Idempotence and Recovery
- Safe retry steps:
- Rollback steps (if applicable):
- Resume instructions:

## Interfaces and Dependencies
- APIs touched:
- Events emitted:
- Schema changes:
- External deps:

## Artifacts and Notes
- PR links, screenshots, logs, migrations, etc.
```
