# Accessibility (agent-ref)

## Purpose
Provide an execution-focused reference for CollabSphere accessibility requirements, ensuring UI is WCAG 2.1 AA compliant and includes required keyboard, focus, and ARIA behaviors.

## Canonical Sources
- `docs/spec/03-information-architecture/03.10-accessibility.md` — WCAG 2.1 AA requirements, component patterns
- `docs/spec/03-information-architecture/03.7-page-states.md` — error state messaging and UX requirements
- `docs/spec/03-information-architecture/03.3-navigation-components.md` — navigation structure context
- `docs/domains/tasks/board-list-view.md` — keyboard DnD guidance
- `docs/domains/documents/editor-capabilities.md` — editor content safety constraints

## Domain Sources
- `docs/domains/tasks/board-list-view.md` — keyboard DnD guidance
- `docs/domains/documents/editor-capabilities.md` — editor content safety constraints

## Scope
- WCAG 2.1 AA compliance requirements
- Keyboard navigation and focus management
- ARIA requirements for key components
- Screen reader announcements
- Drag-and-drop alternatives
- Motion and color-independence rules

## Required Rules / Contract

### Compliance Target
- WCAG 2.1 Level AA is required for all UI surfaces.

### Color Contrast
- Minimum 4.5:1 for normal text.
- Minimum 3:1 for large text (18px+ or 14px+ bold).
- Validate in light and dark themes.

### Keyboard Navigation
- All interactive elements must be reachable and operable via keyboard alone.
- Tab order follows visual order.
- Custom components must implement proper `tabindex`, `role`, and keyboard handlers.

### Focus Indicators
- Visible focus ring on all interactive elements.
- 2px solid outline using `--color-accent` with 2px offset.
- Never remove focus outlines without a replacement.

### Screen Reader Support
- Use semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>`, `<button>`, `<heading>`.
- Icon-only buttons must include accessible labels.
- Use ARIA live regions for dynamic updates.

### Skip Navigation
- Include “Skip to main content” link at top of page.
- Visually hidden until focused.
- Links to `<main>` element.

### Images
- Decorative images: `alt=""`.
- Meaningful images: descriptive alt text.
- User avatars: `alt="[Name]'s avatar"`.

### Forms
- Every input must have associated `<label>` with `htmlFor`.
- Error messages linked via `aria-describedby`.
- Required fields marked with `aria-required`.

### Motion
- Respect `prefers-reduced-motion`.
- If enabled, set transitions to 0ms and disable animations.

### Color Independence
- Do not convey information by color alone.
- Task priorities and status indicators must include text labels or icons in addition to color.

### Drag and Drop Alternatives
- Provide non-drag alternatives:
  - Kanban: keyboard shortcut `M` to move focused task, arrow keys to choose column, Enter to confirm.
  - Documents: toolbar button alternative for reordering.
- Announce drag completion via `aria-live`.

### Announcements (ARIA Live)
- On drag completion: “Task [title] moved to [column]”.
- On notification received: “New notification: [title]”.
- On save: “Document saved”.
- Use `aria-live="polite"` for these updates.

### Required ARIA Patterns (Selected)
- Sidebar navigation: `<nav aria-label="Workspace navigation">`
- Dropdown menu: `role="menu"` / `role="menuitem"`, `aria-expanded`
- Modal/Dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; trap focus; Esc closes; restore focus
- Notification badge: `aria-label="3 unread notifications"`
- Task card: `<article aria-label="Task: [title], Priority: [priority], Assigned to: [name]">`
- Tab panel: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`
- Toast/Alert: `role="alert"` or `role="status"`, `aria-live="polite"`

## Edge Cases / Failure Modes
- Drag-and-drop without keyboard alternative is non-compliant.
- Missing focus outline or improper focus trap in modals is non-compliant.
- Color-only status or priority indicators are non-compliant.
- Missing labels on icon-only buttons is non-compliant.

## Validation or Testing Notes
- Verify WCAG 2.1 AA contrast in light/dark themes.
- Test full keyboard navigation for all screens and modals.
- Validate ARIA roles/labels for required components.
- Confirm skip link, focus management, and live region announcements.
- Validate drag-and-drop keyboard alternatives.

## Related Files / Domains
- `docs/agent-ref/ui/routes.md`
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/responsive-rules.md`
- `docs/agent-ref/rules/validation-rules.md`


