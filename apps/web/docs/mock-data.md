# Mock Data

The app currently runs entirely on mocks. All mock modules live in
`src/lib/mock-*.ts` and expose Promise-returning functions so the swap to
real APIs is mechanical.

| Module | Purpose |
|--------|---------|
| `mock-user.ts` | Current user, including `globalRole` for admin gating. |
| `mock-members.ts` | Workspace members + invitations. |
| `mock-tasks.ts` | Tasks for board/list views. |
| `mock-document-tree.ts` | Document hierarchy for the docs sidebar. |
| `mock-comments.ts` | Document comment threads. |
| `mock-activity.ts` | Workspace activity events. |
| `mock-notifications.ts` | Notifications for the bell + center. |
| `mock-notification-prefs.ts` | Per-type notification preferences. |
| `mock-admin.ts` | Admin dashboard data, users, workspaces, audit log. |
| `workspace-store.ts` | Lightweight current-workspace store. |

## Conventions

- Functions return `Promise<{ data: ... }>` shaped responses to mimic the
  eventual API envelope.
- Filtering and pagination are implemented client-side for now. When the
  real API arrives, push these to the server (see the spec corrections
  doc — server-side pagination/filters are a stated requirement).

## Audit severity (post-correction)

`mock-admin.ts` uses `info | warn | error` for audit severity. This
matches the spec; do not reintroduce `warning` / `critical`.

## Admin gating

`mock-user.ts` exposes a `globalRole` field. `admin-guard.tsx` redirects
non-admins to `/dashboard`. Flip the mock value to test the gate.
