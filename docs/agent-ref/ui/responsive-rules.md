# Responsive Rules (agent-ref)

## Purpose
Provide execution-focused responsive behavior rules for CollabSphere UI, including breakpoints, layout adjustments, and touch interactions.

## Canonical Sources
- `docs/spec/03-information-architecture/03.8-responsive-specs.md`
- `docs/spec/03-information-architecture/03.3-navigation-components.md`
- `docs/spec/03-information-architecture/03.7-page-states.md`
- `docs/domains/tasks/board-list-view.md`
- `docs/domains/documents/editor-capabilities.md`

## Domain Sources
- `docs/domains/tasks/board-list-view.md`
- `docs/domains/documents/editor-capabilities.md`

## Scope
- Breakpoints and layout behavior by device size
- Navigation and sidebar behavior per breakpoint
- Core screen-specific responsive rules (editor, task board, modals)
- Touch interaction requirements for mobile/tablet

## Required Rules / Contract

### Breakpoints (authoritative)
- **Mobile**: 0–767px
- **Tablet**: 768–1279px
- **Desktop**: 1280–1919px
- **Wide**: 1920px+

### Layout behavior by breakpoint

#### Top Navigation
- **Mobile**: hamburger + logo + bell + avatar; search hidden (Cmd/Ctrl+K). Workspace switcher hidden (hamburger).
- **Tablet**: full top nav; search narrower.
- **Desktop/Wide**: full top nav with all elements.

#### Left Sidebar
- **Mobile**: hidden by default; opens full-screen slide-over via hamburger or swipe.
- **Tablet**: collapsed to 60px icon-only by default; expands overlay on click.
- **Desktop**: visible at 260px; collapsible to 60px.

#### Main Content
- **Mobile**: full width, 16px padding.
- **Tablet**: full width minus sidebar (collapsed = full width).
- **Desktop**: width minus sidebar, max-width 1200px centered.

### Document Editor
- **Mobile**: full-screen editor; simplified toolbar (top 6 actions + overflow). Comment sidebar hidden (toggle).
- **Tablet**: editor with reduced toolbar; comment sidebar toggleable.
- **Desktop/Wide**: full editor; optional right comment sidebar (320px) and optional left outline panel.

### Task Board
- **Mobile**: single-column view; swipe left/right between columns; list view is default.
- **Tablet**: all columns visible, narrower cards.
- **Desktop/Wide**: all columns visible, full cards.

### Task Detail
- **Mobile**: full-screen page.
- **Tablet**: slide-over panel from right (480px).
- **Desktop/Wide**: slide-over panel from right (560px).

### Tables / Lists
- **Mobile**: card layout; horizontal scroll for essential tables.
- **Tablet**: responsive table with horizontal scroll if needed.
- **Desktop/Wide**: full table layout.

### Modals / Dialogs
- **Mobile**: full-screen (bottom sheet pattern on iOS-style devices).
- **Tablet**: centered modal, max width 600px.
- **Desktop/Wide**: centered modal, max width 640px.

### Command Palette
- **Mobile**: full-width, top-aligned.
- **Tablet**: centered, 600px wide.
- **Desktop/Wide**: centered, 640px wide.

### Touch interactions (mobile/tablet)
- Swipe right from left edge → open sidebar.
- Swipe left on sidebar → close sidebar.
- Swipe left/right on task board → navigate columns.
- Long-press on task card → context menu (edit/assign/move/delete).
- Pull down on list → refresh data.
- Swipe left on notification → mark read/dismiss.

## Edge Cases / Failure Modes
- If sidebar is open on mobile, selecting a nav item must close it.
- Mobile task board must always have a usable list view fallback.
- Modals on mobile must not render partially off-screen.

## Validation or Testing Notes
- Verify layouts at all breakpoints.
- Validate touch gestures do not conflict with scroll in task board.
- Ensure keyboard-only interactions remain functional despite responsive changes.
- Confirm page states (Loading/Empty/Error/Loaded) are preserved at every breakpoint.

## Related Files / Domains
- `docs/agent-ref/ui/routes.md`
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/rules/validation-rules.md`


