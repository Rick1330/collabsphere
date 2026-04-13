# AGENTS.md

## Purpose
Local hard rules for `apps/web` implementation work. These are the Tier A frontend governance rules and are intended to be enforceable in implementation and review.

## Scope
`apps/web` routes, layouts, components, hooks, styling, tests, and prompt-contract expectations for web batons.

## Tier A Hard Rules

### Architecture And Runtime
- Preserve the Next.js App Router foundation in `src/app`; do not reintroduce `src/index.html` as the web source-of-truth.
- Treat current routes and layouts as architectural foundation, not proof that downstream feature stories are already complete.
- Keep Vercel as the web deployment target and keep local, dev, and build contracts truthful with the implemented Next runtime.
- Do not invent frontend architecture that conflicts with canonical repo and spec docs.

### Styling And Component Rules
- Style from tokens first; do not introduce raw ad hoc colors in feature components when tokenized or semantic styling already exists.
- Prefer source-owned UI primitives for standard interaction patterns; do not hand-build menu, dialog, sheet, popover, or command behaviors if the accepted primitive layer covers them.
- Every page or major section must handle Loading, Empty, Error, and Loaded states when the surface is data-driven.
- Keep responsive behavior and accessibility as first-class contracts, not afterthoughts.

### Data And State Rules
- Use TanStack Query for server state and mutations; follow optimistic update rules.
- Do not implement custom fetch-in-`useEffect` flows when query or mutation infrastructure already fits the use case.
- Respect auth and session boundaries; do not assume access outside documented API contracts.
- Until session and RBAC wiring lands, non-public route groups must deny by default and redirect to `/login` before protected UI renders.
- Realtime app updates use Socket.IO; apply fallback polling intervals when sockets fail.
- Document editor loads content via collab service (Hocuspocus), not REST.
- Auth and session expiry must redirect to `/login` with appropriate UX state.

### Interaction And Accessibility Rules
- Accessibility and responsive rules are mandatory (WCAG 2.1 AA).
- Interactive components must support keyboard navigation, focus visibility, semantic roles and labels, and coherent dismissal and restore behavior.
- Behavior-first tests are required for interactive component changes; static markup checks alone are not sufficient.

### Delivery And Review Rules
- Frontend prompts and implementation should follow split-lane thinking when appropriate: UI composition, API integration, then validation.
- Branch freshness is required before merge-readiness claims; stale-path reconciliation must happen before implementation expands.
- PR, handoff, and closure comments must use clean markdown with truthful validation evidence.

## Never Do
- Assume API fields or behaviors not in `docs/agent-ref/api/*`.
- Bypass error handling or display raw server errors.
- Fetch or render document CRDT/Yjs state from REST endpoints.
- Hardcode role assumptions; always use RBAC responses.
- Treat Socket.IO app events as document collaboration events (distinct services).

## Tests / Validation
- Add/update unit and component tests for UI behavior changes.
- For interactive web surfaces, place behavior tests under `apps/web/src/**` using Vitest + Testing Library; do not add new root `tests/unit/web-*.test.tsx` static-markup tests for those interactions.
- Validate page-state coverage (Loading/Empty/Error/Loaded).
- Verify optimistic updates roll back correctly on errors.
- Re-run affected validations after review-driven code changes.

## References
- `apps/web/REVIEW.md`
- `docs/agent-ref/ui/routes.md`
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/ui/responsive-rules.md`
- `docs/agent-ref/ops/frontend-baton-prompt-template.md`
- `docs/agent-ref/api/document-endpoints.md`
- `docs/agent-ref/api/task-endpoints.md`
- `docs/agent-ref/api/comment-endpoints.md`
- `docs/agent-ref/api/notification-endpoints.md`
- `docs/agent-ref/api/search-endpoints.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/events/activity-rules.md`
