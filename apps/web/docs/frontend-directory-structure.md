# Frontend Directory Structure

## Current layout

```
src/
├── main.tsx                   React root + theme bootstrap
├── App.tsx                    Mounts providers + BrowserRouter + AppRoutes
│
├── app/
│   ├── providers/             AppProviders (QueryClient, Tooltip, Toasters)
│   ├── routing/               app-routes.tsx — single route table
│   └── shell/                 app-sidebar, top-nav, command-palette
│
├── api/                       Backend-facing seam (see src/api/README.md)
│   ├── client/                fetch wrapper + auth header injection
│   ├── contracts/             Wire-shape DTOs
│   ├── adapters/              Per-domain functions consumed by UI
│   │     activity.ts, admin.ts, analytics.ts, auth.ts,
│   │     dashboard.ts, documents.ts, files.ts, labels.ts,
│   │     members.ts, notifications.ts, settings.ts,
│   │     tasks.ts, templates.ts, workspaces.ts
│   └── mocks/                 Namespaced re-exports of src/lib/mock-*
│
├── features/                  Feature folders — all major slices migrated
│   ├── auth/                  ✅ components + pages
│   ├── landing/               ✅ components + pages
│   ├── dashboard/             ✅ components + pages
│   ├── workspace/             ✅ components + pages + store
│   ├── documents/             ✅ components + pages + hooks + mocks
│   ├── tasks/                 ✅ components + pages + hooks + mocks
│   ├── members/               ✅ components + pages
│   ├── activity/              ✅ components + pages
│   ├── notifications/         ✅ components + pages
│   ├── settings/              ✅ components + pages
│   ├── admin/                 ✅ components + pages
│   ├── files/                 ✅ pages
│   ├── templates/             ✅ pages
│   └── analytics/             ✅ pages
│
├── pages/                     Legacy bucket — only NotFound remains
│
├── components/
│   ├── ui/                    shadcn primitives
│   └── shared/                cross-feature presentational helpers
│
├── hooks/                     Cross-feature hooks only
├── lib/                       Cross-feature mocks + format helpers
├── routes/                    TanStack stubs only (host fallback)
└── test/
    └── setup/index.ts         Global vitest setup
```

## Ownership rules

1. **New feature work** lives under `src/features/<f>/`.
2. **Backend-facing logic** flows through `src/api/adapters/`. Pages,
   components, and feature hooks for migrated slices import types,
   helpers, and async data from `@/api/adapters/<domain>` — not from
   `@/features/<f>/mocks/*`.
3. **Feature mocks** still live under `src/features/<f>/mocks/`, but they
   are implementation detail behind the adapter; new code should not
   import from them directly.
4. **Cross-feature mocks** (members, comments, academic, templates) stay
   in `src/lib/mock-*.ts` until they get their own adapter slice.
5. **Tests** colocate next to the file under test as `*.test.ts(x)`.
   Global setup lives only at `src/test/setup/index.ts`.

## What's next

Feature/folder migration is complete. The remaining work is incremental:

1. Continue replacing direct `src/lib/mock-*` imports with adapter calls
   wherever a feature still reaches past its own adapter.
2. Add adapter-level tests as new domains gain non-trivial business logic.
3. When the real backend lands, swap each adapter body for a
   `request(...)` call from `src/api/client` — the UI does not change.
