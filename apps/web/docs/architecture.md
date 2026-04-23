# Architecture (Summary)

> This file is a quick-reference summary. The authoritative architecture
> docs are:
>
> - [`frontend-architecture.md`](./frontend-architecture.md) — runtime,
>   layered ownership, hard rules.
> - [`frontend-directory-structure.md`](./frontend-directory-structure.md) —
>   current layout, target feature-folder layout, migration order.
> - [`frontend-routing-guide.md`](./frontend-routing-guide.md) — how routes
>   are wired and how not to reintroduce a second router.
> - [`frontend-testing-guide.md`](./frontend-testing-guide.md) — where tests
>   live and how to write them.

## Stack at a glance

- React 18 + Vite (SPA, client-rendered).
- **Routing source of truth**: `react-router-dom` in `src/App.tsx`.
- TanStack Router files under `src/routes/*` are **thin SPA fallback
  shells** that mount `<App />`. They contain no business logic. See the
  routing guide for why both layers exist and when they collapse.
- Tailwind CSS with semantic tokens in `src/index.css`.
- TanStack Query for async (currently mock fixtures).
- shadcn/ui primitives in `src/components/ui/*`.

## Folder layout (current)

```
src/
├── App.tsx                  # <BrowserRouter> + <AppRoutes> mount point
├── main.tsx                 # React root + theme bootstrap
├── router.tsx               # Defensive TanStack stub for host fallback
├── routes/                  # Inert TanStack route stubs (host fallback)
├── app/                     # AppProviders, AppRoutes, persistent shell
├── api/                     # adapters/, client/, contracts/, mocks/
├── features/<f>/            # All major slices (components, pages,
│                            #   hooks, mocks per feature)
├── components/
│   ├── ui/                  # shadcn primitives
│   └── shared/              # cross-feature presentational helpers
├── hooks/                   # Cross-feature hooks only
├── lib/                     # Cross-feature mock-*.ts + format helpers
├── pages/                   # Legacy bucket — only NotFound remains
├── test/setup/              # Global vitest setup
└── index.css                # Tailwind layer + design tokens
```

For per-feature breakdown, read `frontend-directory-structure.md`.

## Hard rules (don't violate)

1. Internal navigation uses `<Link>` / `useNavigate()` from
   **react-router-dom**. Never `<a href>`, never `window.location.href`.
2. Never import from `@tanstack/react-router` outside `src/routes/*`
   stubs and `src/router.tsx` — that reactivates a second router.
3. Use semantic design tokens from `src/index.css`. No hardcoded hex.
4. Migrated UI fetches via `src/api/adapters/<domain>`. Pages/components
   must not import from `@/features/<f>/mocks/*` or `@/lib/mock-*` for
   migrated domains.
5. Admin pages wrap in `<AdminGuard>` from
   `src/features/admin/components/admin-guard.tsx`.

## Provider chain

```
QueryClientProvider              (src/app/providers/app-providers.tsx)
  └─ TooltipProvider
       ├─ <Toaster /> + <Sonner />
       └─ BrowserRouter → <AppRoutes />   (src/app/routing/app-routes.tsx)
```

New global providers go in `src/app/providers/app-providers.tsx`.
