// Defensive stub for the preview host (TanStack Start probe).
// The real app uses react-router-dom (see src/App.tsx and
// docs/frontend-routing-guide.md). Do not add app logic here.
import { createRootRoute, createRouter } from "@tanstack/react-router";

const rootRoute = createRootRoute({ component: () => null });

export function getRouter() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (createRouter as any)({ routeTree: rootRoute });
}

export const router = getRouter();
