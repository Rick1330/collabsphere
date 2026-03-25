# search/user-flows

## Domain
Search user flows and UX behavior for workspace-scoped, global, and admin search.

## Canonical Sources
- `docs/spec/04-user-flows/04.10-search.md` — FL-009 Search (entry points, behavior, edge cases)
- `docs/spec/03-information-architecture/03.2-route-map.md` — routes (`/search`, `/w/:workspaceId/search`)
- `docs/spec/03-information-architecture/03.3-navigation-components.md` — global search bar + command palette
- `docs/spec/05-features/05.4-documents.md` — document search fields
- `docs/spec/05-features/05.5-tasks.md` — task search fields
- `docs/spec/11-security/11.4-authorization-workspace-isolation.md` — isolation constraints

## Included Topics
- Entry points and search modes
- Workspace vs global scope behavior
- Result presentation and navigation
- Permission enforcement and isolation
- Edge cases and UX guardrails

## FL-009 — Search (Workspace-Scoped + Global)

### Entry points
- Top navigation search bar (always visible when authenticated).
- Command palette (`Cmd+K` / `Ctrl+K`) includes search.
- Workspace context (`/w/:workspaceId/*`) defaults to workspace-scoped search.
- Global context (`/dashboard`, `/workspaces`, `/notifications`) defaults to global search.

### Search modes
1. **Workspace-scoped search** (default inside a workspace)
   - Scope only current workspace.
   - Route: `/w/:workspaceId/search?q=...` (or `/search` with workspace filter).
2. **Global search** (across all user’s workspaces)
   - Scope all workspaces user is a member of.
   - Route: `/search?q=...`.
3. **Admin global search** (platform admin only)
   - Available only under `/admin/*`.
   - Must be separated from normal user experience to avoid exposure.

### Dropdown results (typeahead)
- Debounced input (~200ms).
- Show up to 5 results per type (Documents, Tasks).
- Provide “View all results” link to full results page.

### Full results page
- Tabs: All / Documents / Tasks.
- Filters:
  - Workspace (global mode)
  - Status (tasks)
- Pagination: 25 per page.
- Highlight matched terms in snippet (`<mark>`).

### Result rendering
- Documents: title, snippet, workspace name (global), last updated.
- Tasks: title, status, assignee, workspace name (global), due date optional.
- Clicking result navigates to its resource.

### Permissions & isolation (MUST)
- Workspace search validates membership for the workspace.
- Global search joins against memberships; no results outside user’s workspaces.
- Admin search requires global role `ADMIN` and admin route guard.
- Results must be permission-aware (no hidden/forbidden entities).

### Edge cases (MUST)
- Empty query: UI disables submit; API returns 400.
- Very long query (>200 chars): truncate client-side; API returns 400 if exceeded.
- Special characters: use safe `websearch_to_tsquery` handling.
- Stale index: acceptable short lag for CRDT-derived plaintext.

### Realtime considerations
- Search results are not pushed in realtime; users refresh or re-run query.

### Noisy events
- Search does not generate activity events by default (avoid noise).
- Analytics events are optional and must not log raw query strings.