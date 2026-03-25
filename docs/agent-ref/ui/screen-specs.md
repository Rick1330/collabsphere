# UI Screen Specs (agent-ref)

## Purpose
Provide a compact, execution-focused reference for core screen expectations, layouts, and UI behaviors for CollabSphere.

## Canonical Sources
- `docs/spec/03-information-architecture/03.1-app-structure.md`
- `docs/spec/03-information-architecture/03.2-route-map.md`
- `docs/spec/03-information-architecture/03.3-navigation-components.md`
- `docs/spec/03-information-architecture/03.7-page-states.md`
- `docs/spec/03-information-architecture/03.8-responsive-specs.md`
- `docs/spec/03-information-architecture/03.10-accessibility.md`
- `docs/domains/tasks/board-list-view.md`
- `docs/domains/documents/editor-capabilities.md`
- `docs/domains/files/feature-spec.md`

## Domain Sources
- `docs/domains/tasks/board-list-view.md`
- `docs/domains/documents/editor-capabilities.md`
- `docs/domains/files/feature-spec.md`

## Scope
- Screen-level requirements for major UI surfaces
- Layout expectations by context (public/global/workspace/admin)
- Key interaction patterns (task board/list, editor, files, activity)
- Required page states and responsive behaviors

## Required Rules / Contract

### Contexts and layouts
- **Public context**: landing + auth pages (no app shell).
- **Global context**: authenticated, no workspace context; AppShell layout.
- **Workspace context**: `/w/:workspaceId/*` routes; workspace sidebar + top nav.
- **Admin context**: `/admin/*` routes; admin sidebar + admin-only access.

### Global Screens (Authenticated)
- **Dashboard (`/dashboard`)**
  - Shows recent workspaces, my tasks, recent activity.
  - Empty states and CTAs per page-states spec.
- **Workspace list (`/workspaces`)**
  - List of member workspaces.
  - CTA: “Create Workspace”.
- **Notifications (`/notifications`)**
  - Full notification history with filters.
  - “All caught up” empty state.
- **Settings (`/settings/*`)**
  - Profile, password, notifications, appearance.

### Workspace Screens
- **Workspace Home (`/w/:workspaceId`)**
  - Summary cards + shortcuts.
- **Documents (`/w/:workspaceId/documents`)**
  - Folder tree + list.
  - Drag-and-drop ordering.
  - Empty state with “Create Document” (Member+).
- **Document Editor (`/w/:workspaceId/documents/:documentId`)**
  - Full Tiptap editor with collaboration.
  - Comment sidebar (toggleable).
  - Read-only banner when locked/submitted/approved/archived workspace or collab down.
- **Document History (`/w/:workspaceId/documents/:documentId/history`)**
  - Version list; restore actions (Manager+).
- **Tasks Board (`/w/:workspaceId/tasks`)**
  - Kanban board (default); columns by status.
  - Drag-and-drop; keyboard alternative required.
- **Tasks List (`/w/:workspaceId/tasks/list`)**
  - Table/list with filters and sorting.
- **Task Detail (`/w/:workspaceId/tasks/:taskId`)**
  - Full task detail (panel on desktop/tablet; full screen on mobile).
- **Members (`/w/:workspaceId/members`)**
  - Role management; invite controls (Admin+).
- **Activity (`/w/:workspaceId/activity`)**
  - Chronological activity feed; no per-keystroke entries.
- **Files (`/w/:workspaceId/files`)**
  - File library with filters; upload (Member+).
- **Analytics (`/w/:workspaceId/analytics`)**
  - Manager+ only.
- **Workspace Settings (`/w/:workspaceId/settings`)**
  - Admin+ only; includes danger zone actions.

### Admin Screens
- **Admin Dashboard (`/admin`)**
  - Platform metrics.
- **Admin Users (`/admin/users`)**
  - List/search; user detail actions.
- **Admin Workspaces (`/admin/workspaces`)**
  - List/search; archive/unarchive/delete actions.
- **Admin Audit (`/admin/audit`)**
  - Audit log filters; admin-only.

### Required Page States (All Screens)
- Loading: skeletons (no spinner-only).
- Empty: illustration + message + CTA where appropriate.
- Error: message + retry; include `requestId`.
- Loaded: normal content.

### Responsive behaviors (key screens)
- **Editor**: full-screen on mobile; sidebar toggleable on tablet; full layout on desktop.
- **Task board**: single-column swipe on mobile; full columns on desktop.
- **Task detail**: full-screen on mobile; slide-over on tablet/desktop.
- **Sidebar**: hidden on mobile; collapsed on tablet; full on desktop.

## Edge Cases / Failure Modes
- 401 → redirect to login with session expired message.
- 403 → “No permission” page state; route back to dashboard.
- 404 (workspace/document/task) → route to respective list page with not-found message.
- Offline → retry CTA; do not show stack traces.
- Collaboration service down → editor opens read-only with banner.

## Validation or Testing Notes
- Verify each screen’s empty/error/loading states match canonical messages and CTAs.
- Confirm responsive breakpoints and layout behavior.
- Ensure keyboard navigation and focus indicators on all interactive elements.
- Confirm role-gated screens are not visible/accessible to unauthorized roles.

## Related Files / Domains
- `docs/agent-ref/ui/routes.md`
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/ui/responsive-rules.md`
- `docs/agent-ref/rules/security-rules.md`


