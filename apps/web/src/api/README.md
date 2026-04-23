# API Layer

This folder is the seam between the UI and the (future) backend. Today the app
runs entirely on mocks; this layer exists so swapping to a real backend is a
contained change.

## Layout

```
api/
├── client/      Shared HTTP client + auth token injection point
├── contracts/   Wire-shape DTO types returned by the backend
├── adapters/    Per-domain functions the UI calls (auth, workspaces, …)
└── mocks/       Re-exports of src/lib/mock-*.ts during the mock era
```

## Rules

- **UI components import from `adapters/`, never from `client/` directly.**
  That keeps domain logic out of components and gives mocks/real-API parity.
- **`adapters/` may import from `mocks/` today**; tomorrow they call
  `request()` from `client/`. Component code does not change.
- **`contracts/` is wire-shape only.** UI-shaped types live next to features.
  If they diverge, do the conversion inside the adapter.
- **`client/` is the only place that touches `fetch`.** Auth headers, base
  URL, error normalization all live there.

## Migration path

1. Add the real endpoint to `client/` if it needs special handling.
2. Add or update the contract type in `contracts/`.
3. Swap the `TODO(api)` body in the matching adapter for a `request(...)`
   call.
4. Delete the mock once every adapter that consumed it has been swapped.
