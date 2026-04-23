# Frontend Testing Guide

## Stack

- **Runner**: Vitest (`vitest.config.ts`), jsdom environment, globals enabled.
- **DOM**: `@testing-library/react` + `@testing-library/jest-dom`.

## Setup

Single global setup file: `src/test/setup/index.ts` — registers
`@testing-library/jest-dom` matchers and shims `window.matchMedia` for jsdom.
Wired via `setupFiles` in `vitest.config.ts`.

## Test placement

Colocate tests next to the file under test:

```
src/api/adapters/tasks.ts
src/api/adapters/tasks.test.ts                      ← adapter contract test
src/features/tasks/hooks/use-task-list-query-state.ts
src/features/tasks/hooks/use-task-list-query-state.test.ts   ← hook behavior
src/features/tasks/components/task-status-badge.tsx
src/features/tasks/components/task-status-badge.test.tsx     ← branching UI
src/features/tasks/pages/Tasks.tsx
src/features/tasks/pages/Tasks.test.tsx              ← page smoke
```

Do **not** create a parallel `src/test/<feature>` tree. Setup is the only
thing that lives under `src/test/`.

## Running

```sh
npm run test          # one-shot
npm run test:watch    # watch mode
```

Vitest discovers `src/**/*.{test,spec}.{ts,tsx}`.

## Coverage patterns now in the repo

The post-migration baseline ships representative tests for each shape
across two domains. Copy these when extending coverage to a new slice:

| Shape                   | Examples                                                                 | Catches                                     |
|-------------------------|--------------------------------------------------------------------------|---------------------------------------------|
| Adapter contract        | `src/api/adapters/tasks.test.ts`, `src/api/adapters/notifications.test.ts`, `src/api/adapters/members.test.ts` | Shape drift, broken pagination/filters/role policy |
| Hook behavior           | `src/features/tasks/hooks/use-task-list-query-state.test.ts`, `src/features/documents/hooks/use-document-tree-state.test.ts` | State-machine regressions (sort/paging, expansion) |
| Branching component     | `src/features/tasks/components/task-status-badge.test.tsx`, `src/features/notifications/components/notification-icon.test.tsx` | Missing or wrong UI for a domain branch     |
| Page smoke              | `src/features/tasks/pages/Tasks.test.tsx`, `src/features/notifications/pages/Notifications.test.tsx` | Boot crashes under router + query context   |

## Conventions

- Render with `render()` from `@testing-library/react`; prefer queries by
  accessible role / text.
- Wrap router-dependent components in `<MemoryRouter>` instead of mocking
  the router.
- For adapter tests, import from `src/api/adapters/*` and assert on the
  returned shape + pure helpers. Stub mocks only when validating wire
  contracts.
- Avoid snapshots for layout-heavy components — prefer behavioral
  assertions.
