# AGENTS.md

## Purpose
Local rules for the current `apps/web` Next.js App Router foundation and the downstream product frontend work that will extend it.

## Scope
`apps/web` App Router routes, layouts, placeholder pages, and deployment-facing web runtime during the PRJ-02 transition.

## Must Follow
- Preserve the Next.js App Router foundation in `src/app`; do not reintroduce `src/index.html` as the web source-of-truth.
- Treat the current routes/layouts as architectural foundation, not proof that downstream PRJ-02 feature stories are already complete.
- Keep Vercel as the web deployment target and keep local/dev/build contracts truthful with the implemented Next runtime.
- Every page must implement Loading, Empty, Error, and Loaded states.
- Use TanStack Query for server state and mutations; follow optimistic update rules.
- Respect auth/session boundaries; do not assume access outside API contracts.
- Until session and RBAC wiring lands, non-public route groups must deny by default and redirect to `/login` before protected UI renders.
- Realtime app updates use Socket.IO; apply fallback polling intervals when sockets fail.
- Document editor loads content via collab service (Hocuspocus), not REST.
- Auth/session: expired sessions redirect to `/login` and show appropriate state.
- Accessibility and responsive rules are mandatory (WCAG 2.1 AA).

## Never Do
- Assume API fields or behaviors not in `docs/agent-ref/api/*`.
- Bypass error handling or display raw server errors.
- Fetch or render document CRDT/Yjs state from REST endpoints.
- Hardcode role assumptions; always use RBAC responses.
- Treat Socket.IO app events as document collaboration events (distinct services).

## Tests / Validation
- Add/update unit and component tests for UI behavior changes.
- Validate page-state coverage (Loading/Empty/Error/Loaded).
- Verify optimistic updates roll back correctly on errors.

## References
- `docs/agent-ref/ui/routes.md`
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/ui/responsive-rules.md`
- `docs/agent-ref/api/document-endpoints.md`
- `docs/agent-ref/api/task-endpoints.md`
- `docs/agent-ref/api/comment-endpoints.md`
- `docs/agent-ref/api/notification-endpoints.md`
- `docs/agent-ref/api/search-endpoints.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/events/socket-events.md`
- `docs/agent-ref/events/activity-rules.md`
