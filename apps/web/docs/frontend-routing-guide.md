# Frontend Routing Guide

## Active runtime

**`react-router-dom` v6 is the only runtime router.** It is mounted in
`src/App.tsx` via `<BrowserRouter>` and the route table lives in
`src/app/routing/app-routes.tsx`.

`src/main.tsx` mounts `<App />` directly. There is no TanStack runtime,
no SPA shell indirection, and no second router.

## Defensive TanStack stubs

`src/routes/__root.tsx`, `src/routes/index.tsx`, and `src/routes/$.tsx`
exist as empty stubs only. They are not imported by the application and
are kept solely so the preview host's SPA fallback registration finds
the expected files. Do not add components, providers, navigation, or
business logic to them.

## Adding a route

1. Create the page in `src/features/<feature>/pages/<Name>.tsx` (preferred)
   or `src/pages/<Name>.tsx` (legacy, still supported).
2. Register the URL in `src/app/routing/app-routes.tsx`.
3. Use `react-router-dom` primitives in pages and components:

```tsx
import { Link, useNavigate, useParams, Navigate } from "react-router-dom";
```

## Never

- `<a href="/internal-route">` — full reload, breaks SPA state.
- `window.location.href = "/foo"` — same problem.
- Anything from `@tanstack/react-router` outside `src/routes/*` stubs.
- A second `<BrowserRouter>` — there is exactly one in `src/App.tsx`.

## Route param helpers

When a page needs a workspace param with a sensible default for deep-link
demos, use `resolveWorkspaceParam` from `src/lib/route-params.ts`:

```tsx
const { workspaceId } = useParams<{ workspaceId: string }>();
const id = resolveWorkspaceParam(workspaceId);
```
