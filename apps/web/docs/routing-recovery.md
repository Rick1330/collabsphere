# Routing Recovery — Postmortem

This document explains the crash/routing breakage encountered after the
Members/Activity/Notifications/Settings/Admin pages were introduced, what
caused it, and how it was fixed.

## Symptoms reported by the user

- The landing page and several other routes stopped working.
- Direct navigation to URLs in the preview returned blank pages.
- Header/menu buttons (workspace switcher, notifications bell, user menu,
  "Login" link) did not navigate to the right page when clicked.
- The app had been working "up to the task list page"; surfaces added after
  that — Members, Activity, Notifications, Settings, Admin — were where the
  rot started.

## Root causes

### 1. Stack confusion (Next.js patterns leaking into a Vite SPA)

The later page prompts assumed a Next.js / TanStack Start environment and
were authored with patterns that do not work in this project:

- API routes referenced as `fetch('/api/v1/...')` for forms that had no
  matching handler (e.g. `register-form.tsx` posted to
  `/api/v1/auth/register`, which returned the SPA's `index.html` and broke
  the JSON parse).
- File-based routing assumptions (`app/` or `src/routes/` style) instead of
  the central `<Routes>` table in `src/App.tsx`.
- Server-only features (server functions, edge handlers) referenced where
  this project only has client-side mocks.

A "banana page" (an experimental admin scaffold using Next.js conventions)
was introduced and then removed entirely on the user's request.

### 2. Non-SPA navigation in the shell

After the new pages landed, several shell elements regressed to:

- `<a href="/login">` instead of `<Link to="/login">`
- `window.location.href = "/dashboard"` instead of `navigate("/dashboard")`
- Plain anchors inside the user menu, workspace switcher, and notifications
  dropdown.

Each of those triggers a full page reload. In dev that reload re-requested
URLs that the SPA expected to be handled client-side, which surfaced as
"the route doesn't work" or a flash of blank content.

### 3. Mismatched API contracts in forms

Forms wired to non-existent endpoints (`POST /api/v1/auth/register`,
`PATCH /api/v1/users/me`, `POST /api/v1/auth/change-password`) failed
silently or threw on JSON parse, bubbling up as runtime errors that masked
the underlying routing problem.

## Fixes applied

### Removed the conflicting scaffold

- Deleted the experimental "banana" admin scaffold and any imports it left
  behind.
- Re-adopted the project's actual stack: Vite + React Router, mocks for
  data, no server endpoints.

### Restored SPA navigation

Edited the following files to use `<Link>` / `useNavigate()` consistently:

- `src/components/shell/top-nav.tsx` — workspace switcher, notifications
  bell, user menu (Profile, Settings, Theme, Sign out).
- `src/components/shell/app-sidebar.tsx` — `MobileSidebarContent`.
- `src/components/auth/auth-status-card.tsx` — login/register CTAs.
- `src/components/auth/register-form.tsx` — replaced the
  `/api/v1/auth/register` POST with a mock submission delay and a
  `useNavigate()` redirect to `/verify-email`.

### Verified routes

Walked the route table in `src/App.tsx` and confirmed every page component
referenced in `pages/` exists and renders. Routes verified end-to-end in
the browser:

- `/` — landing
- `/login`, `/register`, `/forgot-password`, `/reset-password`,
  `/verify-email`
- `/dashboard`, `/workspaces`, `/workspaces/new`, `/notifications`
- `/settings`, `/settings/profile`, `/settings/appearance`,
  `/settings/notifications`, `/settings/password`
- `/w/:workspaceId/*` — home, documents, tasks, members, activity,
  settings, coming-soon
- `/admin`, `/admin/users`, `/admin/users/:userId`, `/admin/workspaces`,
  `/admin/workspaces/:workspaceId`, `/admin/audit`, `/admin/settings`

## Lessons / guardrails

1. **One stack, one routing system.** Do not mix Next.js or TanStack Start
   patterns into this project. If a future surface needs SSR or server
   functions, that's a project-level decision, not a per-page choice.
2. **Always `<Link>` for internal navigation.** No `<a href>`, no
   `window.location.href`. The only exception is true external URLs.
3. **No fetch to non-existent endpoints.** Forms must either post to a real
   backend (if/when one exists) or use the mock helpers in `src/lib/`.
4. **When adding routes, register them in `App.tsx`** and verify the URL
   loads in the preview before considering the work done.
5. **When in doubt, walk the route table.** `App.tsx` is the source of
   truth for what URLs exist.
