# Web Page Implementation

## Purpose
Implement a Vite + React SPA page aligned with CollabSphere routing, state, and accessibility rules.

## When to Use
- Creating or modifying a page, route, or route-composed layout under `apps/web`.

## Required Inputs / Context
- Target route and API contract.
- Page state requirements.

## Read First
- `apps/web/AGENTS.md`
- `docs/agent-ref/ui/routes.md`
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/accessibility.md`

## Workflow
1. Confirm route and access requirements.
2. Implement Loading/Empty/Error/Loaded states.
3. Use TanStack Query for data fetching and mutations.
4. Respect auth/session redirects on 401.
5. Ensure accessibility and responsive behavior.
6. Keep task boundaries clean: do not mix backend behavior ownership into UI tasks.

## Dangerous Mistakes
- Using API fields not in contracts.
- Omitting error or empty states.
- Treating Socket.IO events as collaboration events.

## Validation Expectations
- Verify page states and responsive behavior.
- Test optimistic update rollback paths.
- Include explicit checks for access-denied / permission-gated states when applicable.
- Prefer task labels like `spec:web-page` or `spec:data-hooks` instead of generic `spec:ui`.

## Escalation Conditions
- Route behavior conflicts with agent-ref UI routes or API contracts.

## Related Skills / References
- `implementation/react-component.md`
- `implementation/react-form.md`
- `guardrail/socketio-realtime.md`
