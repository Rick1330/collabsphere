# Spec Corrections — Members, Activity, Notifications, Settings, Workspace Settings, Admin

This document records the behavioral corrections applied on top of the
original page prompts (`15`–`20`). It is the **source of truth** for
governance, ownership, and admin-console behavior — the visual prompts are
only the foundation.

The user approved a "highest-impact corrections only" pass. What was done
in that pass is marked ✅. What was deferred is marked ⏳ — those items are
still valid corrections, just not yet implemented.

---

## 1. Members page

- ⏳ Render role display labels from a workspace-provided role-label map
  (e.g. `MANAGER → Tech Lead`) instead of hardcoding labels.
- ⏳ Make invite visibility policy-aware for archived workspaces.
- ⏳ Strengthen pending-invitation row truth: resend / revoke eligibility,
  expiry, invited date.
- ⏳ Keep ownership-transfer entry points consistent with workspace
  settings.

## 2. Activity feed

- ⏳ Keep activity strictly separated from the admin audit log.
- ⏳ Add missing event types: `workspace.role_changed`,
  `document.submitted`, `document.reviewed`, `comment.resolved`,
  optionally coalesced `document.edited`.
- ⏳ Make resource references navigable (link to the doc/task when it
  exists).
- ⏳ Model realtime + 15–30s polling fallback.
- ⏳ Switch to infinite-scroll-compatible pagination instead of
  prev/next-only.
- ⏳ Handle former / deleted actors gracefully (`Former member`,
  `Deleted user`).

## 3. Notification center

- ⏳ Add workspace + type-category filters (Tasks, Documents, Mentions,
  System) on top of unread/all.
- ⏳ Expand notification type coverage to match the spec
  (`document.comment`, `task.comment`, `task.mention`,
  `document.review_*`, `workspace.announcement`,
  `platform.announcement`, `security.password_changed`).
- ⏳ Model realtime push to `user:<userId>` with 30s polling fallback.
- ⏳ Support selected-item bulk read in addition to mark-all-as-read.
- ⏳ Keep workspace vs. global notification context visually distinct.

## 4. User settings

- ⏳ Align routes to the real contracts: `PUT /api/v1/users/me` for
  profile, `PUT /api/v1/users/me/password` for password changes.
- ⏳ Keep appearance UI compatible with persisted user preference and
  prepaint theme behavior (don't lock into localStorage-only).
- ⏳ Add password visibility toggles on all password inputs.
- ⏳ Cover the full notification preferences matrix.
- ⏳ Keep `/api/v1/users/me/avatar` future-compatible.

## 5. Workspace settings

- ✅ **Real Transfer Ownership flow** (replaces the previous placeholder).
  Implemented in
  `src/components/workspace/settings/transfer-ownership-dialog.tsx`:
  - Step 1: pick an eligible new owner (Admin or Manager only,
    excluding the current owner).
  - Step 2: confirm consequences and type the workspace name to enable
    the action.
  - Mock execution promotes the selected member to Owner and demotes the
    current owner to Admin, with a toast confirmation.
- ⏳ Surface workspace role-label mapping in settings.
- ⏳ Build out the dedicated `/w/:workspaceId/settings/members` route
  rather than relying on a summary card.
- ⏳ Keep archive policies (invite restrictions while archived) aligned
  across members and settings surfaces.

## 6. Admin console

### Information architecture

- ✅ **`/admin/workspaces/:workspaceId`** — admin workspace detail page
  with metadata, members list, and content stat cards. See
  `src/components/admin/admin-workspace-detail.tsx` and
  `src/pages/AdminWorkspaceDetail.tsx`.
- ✅ **`/admin/settings`** — read-only system page (API version, build
  commit, environment, region, DB/storage status, platform limits). See
  `src/components/admin/admin-settings.tsx` and
  `src/pages/AdminSettings.tsx`.
- ✅ Both routes registered in `src/App.tsx` and surfaced in
  `src/components/admin/admin-nav.tsx`.

### Audit log

- ✅ Severity model corrected to `info | warn | error` (was
  `info | warning | critical`). Updated in `src/lib/mock-admin.ts`.
- ✅ Audit rows are expandable to inspect raw JSON `metadata`. Updated in
  `src/components/admin/admin-audit.tsx`.

### Still deferred (⏳)

- Dashboard widget completeness (new users 7d, active workspaces 7d,
  storage usage, optional jobs/queue depth, last-updated timestamp,
  refresh action).
- User management filters (status, provider, global role) beyond search.
- User detail actions: revoke sessions, reset-password confirmation
  (local auth only), admin notes.
- Dangerous-action confirmation rules:
  - force delete workspace → typed workspace name
  - promote user to admin → type `PROMOTE`
  - deactivate user → confirm
  - reset password → confirm

---

## Global rules to keep in mind

- **Realtime / polling truth**: surfaces that are live by product design
  should reflect that, with a polling fallback when realtime is degraded.
- **Server-side filters/pagination**: don't silently flatten a server-side
  dataset into a fully client-side filter.
- **Governance truth**: never hide a real role/ownership/permission rule
  behind a "future" placeholder. Especially for transfer ownership, admin
  actions, and notification controls.
- **Route completeness**: don't claim a domain is finished if the route
  map still has missing pages.
