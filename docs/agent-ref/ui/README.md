# UI — Agent Execution Reference

## Purpose
Provide a compact, execution-focused index of UI routes, page states, accessibility, and responsive rules for agents and implementers.

## Canonical Sources
- `docs/spec/03-information-architecture/03.1-app-structure.md`
- `docs/spec/03-information-architecture/03.2-route-map.md`
- `docs/spec/03-information-architecture/03.3-navigation-components.md`
- `docs/spec/03-information-architecture/03.7-page-states.md`
- `docs/spec/03-information-architecture/03.8-responsive-specs.md`
- `docs/spec/03-information-architecture/03.10-accessibility.md`

## Domain Sources
- `docs/domains/search/user-flows.md` (route and page references)
- `docs/domains/tasks/board-list-view.md` (view behavior)
- `docs/domains/documents/editor-capabilities.md` (editor rules)

## Scope
- Route map and context separation (public/global/workspace/admin)
- Page state requirements (loading/empty/error/loaded)
- Accessibility and keyboard rules
- Responsive behavior and layout breakpoints
- Core navigation patterns

## Required Rules / Contract
- All pages must implement the four required states (Loading, Empty, Error, Loaded).
- Route access must respect auth and workspace membership requirements.
- Accessibility target: WCAG 2.1 AA.
- Responsive breakpoints: Mobile (0–767), Tablet (768–1279), Desktop (1280–1919), Wide (1920+).

## Edge Cases / Failure Modes
- 401/403/404 must map to canonical UI error states and actions; use 403 for authenticated non-members.
- Offline state must show a retry action and no stack traces.
- Workspace/document/task not found must route to canonical fallback pages.

## Validation or Testing Notes
- Verify page states per route under empty and error responses.
- Keyboard navigation and focus indicators for all interactive elements.
- Responsive layout checks at each breakpoint.

## Related Files / Domains
- `routes.md`
- `page-states.md`
- `screen-specs.md`
- `component-patterns.md`
- `accessibility.md`
- `responsive-rules.md`
- `docs/agent-ref/rules/security-rules.md`
