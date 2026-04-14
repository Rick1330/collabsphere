# Owned UI Primitives

## Purpose
Define the current source-owned primitive layer in `packages/ui` so frontend delivery can reuse standard interaction building blocks instead of re-implementing them in feature code.

## Current Primitive Set

- `button`
- `dialog`
- `dropdown-menu`
- `input`
- `label`
- `separator`
- `sheet`

## Selection Rules

- Add primitives only when they unblock near-term delivery surfaces.
- Prefer source-owned primitives for standard interaction mechanics before hand-building behavior in `apps/web`.
- Do not bulk-install speculative primitives with no immediate consumer path.

## Usage Guidance

- Use `button`, `input`, and `label` for form and CTA surfaces before introducing ad hoc control classes.
- Use `dialog` for centered modal flows.
- Use `sheet` for mobile and side-panel surfaces that need dialog semantics with edge anchoring.
- Use `dropdown-menu` for menu behavior; do not re-implement focus navigation for standard menu patterns.
- Use `separator` for low-level visual grouping instead of repeated one-off border elements.

## Out Of Scope

- This file does not declare feature components, page layouts, or styling themes.
- This file does not require every shadcn primitive to exist immediately.

## References

- `packages/ui/AGENTS.md`
- `apps/web/AGENTS.md`
- `apps/web/REVIEW.md`
- `docs/agent-ref/ui/component-patterns.md`
