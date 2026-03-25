# UI Component Patterns (agent-ref)

## Purpose
Provide execution-focused, reusable UI component patterns with exact behaviors, accessibility requirements, and interaction rules for CollabSphere implementers and agents.

## Canonical Sources
- `docs/spec/03-information-architecture/03.3-navigation-components.md`
- `docs/spec/03-information-architecture/03.10-accessibility.md`
- `docs/spec/03-information-architecture/03.8-responsive-specs.md`
- `docs/spec/03-information-architecture/03.7-page-states.md`
- `docs/domains/tasks/board-list-view.md`
- `docs/domains/documents/editor-capabilities.md`

## Domain Sources
- `docs/domains/tasks/board-list-view.md`
- `docs/domains/documents/editor-capabilities.md`

## Scope
- Navigation components (top nav, sidebars, admin sidebar)
- Common interactive components (modals, dropdowns, toasts, tabs)
- Accessibility and keyboard patterns
- Responsive layout behavior at breakpoints
- Task board and document editor interaction patterns

## Required Rules / Contract

### Top Navigation Bar (Authenticated)
- Always visible on authenticated pages.
- Elements and behaviors:
  - Logo links to `/dashboard`.
  - Workspace switcher dropdown, sorted by last accessed; includes “Create Workspace”.
  - Search bar with shortcut `Cmd+K`/`Ctrl+K` for command palette.
  - Notification bell shows unread count (max “99+”), dropdown last 10 items.
  - User avatar menu: profile, settings, admin link (if admin), theme toggle, sign out.
- Keyboard:
  - Workspace switcher: `Cmd+W`/`Ctrl+W`.
  - Command palette: `Cmd+K`/`Ctrl+K`.

### Global Sidebar (Authenticated, non-workspace)
- Visible on global pages; not on public pages.
- Must include Dashboard, Workspaces, Notifications, Settings, Recent Workspaces, and “New Workspace”.
- Routes per `03.2-route-map`.

### Workspace Sidebar (Workspace context)
- Replaces global sidebar on `/w/:workspaceId/*`.
- Contains Overview, Documents, Tasks, Members, Activity, Files, Analytics (Manager+), Templates, Settings (Admin+).
- Quick actions: “New Document”, “New Task” (Member+).
- Document tree shows workspace hierarchy; supports drag-and-drop reorder.

### Admin Sidebar (Admin routes)
- Visible only on `/admin/*`.
- Includes Admin Dashboard, Users, Workspaces, Audit Log, System Settings.

### Sidebar Behavior by Breakpoint
- Desktop (≥1280px): visible 260px, collapsible to 60px; `Cmd+B`/`Ctrl+B` toggles; state persisted.
- Tablet (768–1279px): collapsed icons by default, expands overlay on hamburger.
- Mobile (<768px): hidden; opens full-screen slide-over; swipe right to open, swipe left to close.

### Modals / Dialogs
- Must use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Focus trapped inside; Esc closes; focus returns to trigger.
- Mobile: full-screen / bottom sheet. Desktop: centered (max-width 640px).

### Dropdown Menus
- Use `role="menu"` and `role="menuitem"`.
- `aria-expanded` required on trigger.
- Keyboard: Enter/Space open, arrows navigate, Esc closes.

### Tabs
- Use `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`.
- Keyboard: arrow keys switch tabs.

### Toasts / Alerts
- Use `role="alert"` or `role="status"`, `aria-live="polite"`.
- Auto-dismiss after 5s; Esc dismisses; do not steal focus.

### Task Board (Kanban)
- Keyboard DnD alternative required:
  - `M` to move focused task, arrow keys select column, Enter confirms.
- Mobile: single column view; swipe horizontally between columns; list view default.
- Column empty state uses CTA per `03.7-page-states`.

### Document Editor
- Desktop: full editor with toolbar; optional comment sidebar (320px) and outline.
- Tablet: reduced toolbar; comment sidebar toggleable.
- Mobile: full-screen editor; simplified toolbar; comment sidebar hidden behind icon.

### Accessibility Standards (WCAG 2.1 AA)
- Color contrast: 4.5:1 normal text, 3:1 large text.
- Visible focus rings: 2px solid `--color-accent` with offset.
- Skip-to-content link at top of page.
- All interactive elements keyboard accessible.
- Screen reader support with semantic HTML and ARIA labels.
- Drag and drop must have keyboard alternative.

## Edge Cases / Failure Modes
- Offline state uses Error pattern with retry; no stack traces.
- 401/403/404 must map to canonical error states and actions; use 403 for authenticated non-members.
- Workspace-level restrictions must be reflected in UI state (disabled actions, lock badges).

## Validation or Testing Notes
- Verify all interactive components meet keyboard navigation and ARIA requirements.
- Test responsive behavior at Mobile/Tablet/Desktop/Wide breakpoints.
- Validate focus trapping and return on modals.
- Confirm DnD keyboard alternative works for tasks and document reorder.

## Related Files / Domains
- `docs/agent-ref/ui/routes.md`
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/screen-specs.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/ui/responsive-rules.md`
- `docs/agent-ref/ui/README.md`


