# AGENTS.md

## Purpose
Local rules for shared UI components and design patterns.

## Scope
`packages/ui` reusable components, design tokens, and UI patterns.

## Must Follow
- Reuse shared components; avoid one-off UI patterns.
- Keep the current primitive inventory documented in `docs/agent-ref/ui/owned-primitives.md` and update it when the owned layer expands.
- Accessibility baseline is WCAG 2.1 AA.
- Responsive behavior must follow canonical breakpoints and rules.
- Use standard page-state patterns (Loading/Empty/Error/Loaded).
- Keep design tokens centralized; extend tokens rather than inline styling.

## Never Do
- Add ad hoc styling that bypasses shared tokens/patterns.
- Introduce inaccessible components or missing keyboard support.
- Ship components without empty/error/loading state handling when applicable.

## Tests / Validation
- Add component-level tests for behavior and accessibility when needed.
- Verify responsive behavior across breakpoints for new components.

## References
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/owned-primitives.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/ui/responsive-rules.md`
- `docs/agent-ref/ui/page-states.md`
