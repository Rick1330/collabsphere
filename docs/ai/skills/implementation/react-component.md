# React Component Implementation

## Purpose
Build reusable components aligned with CollabSphere UI patterns and accessibility rules.

## When to Use
- Creating or updating reusable components (shared or local).

## Required Inputs / Context
- Component usage context and required states.

## Read First
- `packages/ui/AGENTS.md`
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/accessibility.md`

## Workflow
1. Identify required states (loading/empty/error/loaded).
2. Implement accessibility semantics and keyboard behavior.
3. Use shared design tokens and patterns.
4. Add minimal tests for behavior and a11y as needed.

## Dangerous Mistakes
- Ad hoc styling that bypasses tokens.
- Missing keyboard or ARIA support.

## Validation Expectations
- Verify a11y behavior and responsive layout.
- Prefer task labels like `spec:react-component` instead of generic `spec:ui`.

## Escalation Conditions
- Component conflicts with shared UI patterns.

## Related Skills / References
- `implementation/react-form.md`
- `implementation/nextjs-page.md`
