# UI Routes (agent-ref)

## Purpose
Provide a compact, execution-focused route map for CollabSphere UI, including access constraints and context boundaries.

## Canonical Sources
- `docs/spec/03-information-architecture/03.1-app-structure.md`
- `docs/spec/03-information-architecture/03.2-route-map.md`
- `docs/spec/03-information-architecture/03.3-navigation-components.md`
- `docs/spec/03-information-architecture/03.7-page-states.md`

## Domain Sources
- None (spec-only sources for this file)

## Scope
- Public, global, workspace, and admin routes
- Access requirements per route group
- Core navigation boundaries used by agents and implementers

## Required Rules / Contract

### Route Contexts
- **Public**: no authentication required.
- **Global**: authenticated, no workspace context.
- **Workspace**: authenticated + active workspace membership.
- **Admin**: authenticated + global role `ADMIN`.

### Public Routes (No Auth Required)
- `/` — Landing Page
- `/login` — Login
- `/register` — Register
- `/forgot-password` — Forgot Password
- `/reset-password/:token` — Reset Password
- `/verify-email/:token` — Email Verification
- `/invite/:token` — Accept Invitation

### Global Routes (Authenticated, No Workspace Context)
- `/dashboard` — Dashboard
- `/workspaces` — Workspace List
- `/workspaces/new` — Create Workspace
- `/notifications` — Notifications Center
- `/settings` — Settings Layout
- `/settings/profile` — Profile Settings
- `/settings/password` — Password Settings
- `/settings/notifications` — Notification Preferences
- `/settings/appearance` — Appearance

### Workspace Routes (Authenticated + Workspace Member)
- `/w/:workspaceId` — Workspace Home
- `/w/:workspaceId/documents` — Document List
- `/w/:workspaceId/documents/new` — New Document
- `/w/:workspaceId/documents/:documentId` — Document Editor
- `/w/:workspaceId/documents/:documentId/history` — Version History
- `/w/:workspaceId/tasks` — Task Board (default)
- `/w/:workspaceId/tasks/list` — Task List
- `/w/:workspaceId/tasks/:taskId` — Task Detail
- `/w/:workspaceId/members` — Members
- `/w/:workspaceId/activity` — Activity Feed
- `/w/:workspaceId/files` — Files
- `/w/:workspaceId/analytics` — Analytics (Manager+)
- `/w/:workspaceId/settings` — Workspace Settings (Admin+)
- `/w/:workspaceId/settings/members` — Member Management (Admin+)
- `/w/:workspaceId/templates` — Templates

### Admin Routes (Authenticated + Global `ADMIN`)
- `/admin` — Admin Dashboard
- `/admin/users` — User Management
- `/admin/users/:userId` — User Detail
- `/admin/workspaces` — Workspace Management
- `/admin/audit` — Audit Log
- `/admin/settings` — System Settings

## Edge Cases / Failure Modes
- Non-member workspace access must return `403 NOT_WORKSPACE_MEMBER`.
- Admin routes must reject non-admin users with `403 FORBIDDEN` or `ADMIN_ONLY`.
- 401 (session expired) routes must redirect to `/login`.

## Validation or Testing Notes
- Validate route guards for auth + membership + role.
- Verify workspace routes block access when workspace is archived (read-only policy applies).
- Ensure page states follow the 4-state model (Loading, Empty, Error, Loaded).

## Related Files / Domains
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/screen-specs.md`
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/ui/responsive-rules.md`


