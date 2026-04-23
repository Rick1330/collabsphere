# Frontend Architecture

> Status: Living document. Reflects the codebase after the core-feature
> migration + API adoption pass. Read this first before adding new features.

## Stack

- Vite 5 + React 18 + TypeScript (SPA, no SSR)
- `react-router-dom` v6 — single runtime router
- `@tanstack/react-query` — async data + cache (mounted in `AppProviders`)
- shadcn/ui + Tailwind 4 — design system
- `framer-motion`, `tiptap` — interaction surfaces
- `vitest` + `@testing-library/react` — unit tests

## Boot path

```
src/main.tsx
  └─ <App />                          src/App.tsx
       └─ <AppProviders>              src/app/providers/app-providers.tsx
            └─ <BrowserRouter>
                 └─ <AppRoutes />     src/app/routing/app-routes.tsx
```

## Layered seams

| Layer            | Folder                       | Responsibility                                |
|------------------|------------------------------|-----------------------------------------------|
| App shell        | `src/app/`                   | Providers, routing, persistent chrome         |
| Features         | `src/features/<f>/`          | Domain UI (pages, components, hooks, mocks)   |
| Design system    | `src/components/ui/`         | shadcn primitives — do not branch by feature  |
| Shared UI        | `src/components/shared/`     | Cross-feature presentational helpers          |
| API seam         | `src/api/`                   | Backend-facing contracts, adapters, client    |
| Utilities        | `src/lib/`                   | Cross-feature mocks, format helpers           |

The **API seam** (`src/api/adapters/*`) is the canonical data path for
migrated features. UI imports types, helpers, and async functions from
adapters — never directly from `src/features/<f>/mocks/*`. When the backend
lands, only the adapter bodies change.

## Routing reality

Exactly one router: `react-router-dom` in `src/app/routing/app-routes.tsx`.
The `src/routes/*` files are inert TanStack stubs kept only for preview-host
SPA fallback compatibility. Full details in `docs/frontend-routing-guide.md`.

## Testing

- Setup: `src/test/setup/index.ts` (registered in `vitest.config.ts`).
- Convention: tests colocate with the file under test as `*.test.ts(x)`.
- See `docs/frontend-testing-guide.md`.

## Migration state

- ✅ Routing collapsed to RR-DOM only.
- ✅ App shell (`src/app/`) owns providers, routing, chrome.
- ✅ All major feature slices migrated to `src/features/<f>/`:
  `auth`, `landing`, `dashboard`, `workspace`, `documents`, `tasks`,
  `members`, `activity`, `notifications`, `settings`, `admin`, `files`,
  `templates`, `analytics`.
- ✅ Adapter layer covers every major domain — see `src/api/adapters/`
  for the full list (`activity`, `admin`, `analytics`, `auth`,
  `dashboard`, `documents`, `files`, `labels`, `members`,
  `notifications`, `settings`, `tasks`, `templates`, `workspaces`).
  Migrated UI imports types, helpers, and async data from
  `@/api/adapters/<domain>` rather than reaching into
  `@/features/<f>/mocks/*` or `@/lib/mock-*` directly.
- ✅ Colocated tests for representative shapes — adapter contract, hook
  behavior, branching component, page smoke. See
  `docs/frontend-testing-guide.md` for the table.

## What this baseline guards against

- Drift between adapter contracts and UI consumers (adapter tests catch
  shape changes before they reach pages).
- Stateful hooks losing their state-machine invariants (hook tests).
- Branching UI silently falling through to the default case (component tests).
- Page-level boot crashes under the SPA router (page smoke tests).
