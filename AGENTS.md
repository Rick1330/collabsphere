# AGENTS.md

## Purpose
Define repo-wide rules and guardrails for coding agents working in CollabSphere.

## Docs Authority Model
- `docs/spec/` is canonical.
- `docs/domains/` is engineering-oriented and derived from spec.
- `docs/agent-ref/` is execution-oriented and derived from domains/spec.
- If any conflict exists, `docs/spec/` wins.

## Repo Identity
CollabSphere is a realtime collaboration workspace platform built with NestJS (API), Hocuspocus (collab), BullMQ (workers), PostgreSQL + Redis, and a Vite + React SPA web frontend in `apps/web` deployed on Vercel. The current web app is a platform foundation, not a claim that every downstream shell and feature story is already complete.

## ExecPlan Rule
- Use an ExecPlan for complex features, major refactors, tier:S work, or any change touching collab/security/isolation core.
- Canonical ExecPlan template: `.agent/PLANS.md`.
- If no template exists, produce a minimal ExecPlan with goals, assumptions, steps, risks, and tests.

## Execution Behavior
- Default is to implement working code, not stop at planning.
- Validate before marking work complete; record any tests not run and why.
- Document deviations and unresolved blockers explicitly.
- Do not invent policy where docs are unresolved; log in `docs/audit/agents-open-questions.md`.

## Non-Negotiables (Repo-Wide)
- Workspace isolation is absolute; every access must be scoped by `workspace_id` and membership.
- REST must never return collaborative document content (Yjs/CRDT). Document REST is metadata-only.
- Document canonical content is Yjs state; Hocuspocus handles document realtime.
- Socket.IO handles app realtime events (tasks/notifications/activity).
- `content_plaintext` is derived; never edit it as canonical source.
- Responses must follow the standard envelope; errors must use canonical error codes.
- Authenticated non-members must receive `403 NOT_WORKSPACE_MEMBER`.
- Event-driven side effects are required; emit domain events and let workers/dispatchers handle them.
- Do not emit per-keystroke activity or notifications.
- Do not change files outside task scope unless documented in task output.
- Preserve existing user changes in a dirty worktree.
- Never run destructive git commands (e.g., `git reset --hard`, `git checkout --`, force pushes) unless explicitly requested.
- Branching: `main` is deployable; use feature branches → PR → CI → merge.
- Commit messages use Conventional Commits:
  - `feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`, `refactor(scope): ...`, `test(scope): ...`, `docs(scope): ...`

## Dangerous Patterns (Never)
- Bypass RBAC/guards or skip workspace membership checks.
- Return document CRDT/Yjs content through REST endpoints.
- Store raw HTML as canonical content.
- Access cross-workspace data without explicit scope checks or joins.
- Manually mutate derived state as if it were source-of-truth (e.g., `content_plaintext`).
- Emit per-keystroke activity/notification events.
- Bypass event-driven side-effect architecture (e.g., direct notification inserts without domain events).

## Critical Invariants
- No resource-id-only access patterns; all workspace-owned resources require explicit workspace scoping.
- Lock/submission rules must be enforced server-side (REST + realtime).

## References
### Critical Guardrails
- `docs/agent-ref/rules/workspace-isolation.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/error-codes.md`

### Common Execution References
- `docs/agent-ref/api/README.md`
- `docs/agent-ref/data/README.md`
- `docs/agent-ref/events/README.md`
- `docs/agent-ref/collab/README.md`

### Ops References
- `docs/agent-ref/ops/local-dev.md`
- `docs/agent-ref/ops/ci-cd.md`
