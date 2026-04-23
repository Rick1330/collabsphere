# Changelog

A chronological summary of significant changes. Most recent first.

## Documentation pass

- Added `docs/` directory with architecture, routing recovery, spec
  corrections, design system, mock-data, and changelog notes.

## Premium Create Workspace + highest-impact spec corrections

- Rewrote `src/components/workspace/create-wizard.tsx` with an editorial,
  restrained layout (serif display, mono step labels, single-column
  rhythm).
- Implemented a real **Transfer Ownership** flow in
  `src/components/workspace/settings/transfer-ownership-dialog.tsx` and
  wired it into `danger-tab.tsx`. Replaces the previous placeholder.
- Added admin routes:
  - `/admin/workspaces/:workspaceId` — admin workspace detail
    (`AdminWorkspaceDetail.tsx`).
  - `/admin/settings` — read-only system info + platform limits
    (`AdminSettings.tsx`).
- Updated `admin-nav.tsx` to surface the new admin pages.
- Corrected audit severity to `info | warn | error` in
  `src/lib/mock-admin.ts`.
- Made audit rows expandable to inspect JSON metadata in
  `src/components/admin/admin-audit.tsx`.

## Routing recovery

- Removed the experimental "banana" admin scaffold and any Next.js
  patterns it introduced.
- Converted shell navigation to SPA-safe `<Link>` / `useNavigate()`:
  `top-nav.tsx`, `app-sidebar.tsx`, `auth-status-card.tsx`.
- Replaced the broken `POST /api/v1/auth/register` call in
  `register-form.tsx` with a mock submission and a `useNavigate()`
  redirect.
- Verified all registered routes load end-to-end.

## Earlier work (summary)

- Built the public surface: landing, auth flows.
- Built the app shell: top nav, sidebar, command palette.
- Built workspace surfaces: home, documents (tree + Tiptap editor +
  comments), tasks (board + list + detail), create wizard.
- Built governance surfaces: members + invitations, activity feed,
  notifications, user settings, workspace settings.
- Built initial admin console: dashboard, users list/detail, workspaces
  list, audit log.
