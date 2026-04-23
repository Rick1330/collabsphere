// Defensive stub for preview-host SPA fallback registration only.
// The active runtime router is react-router-dom mounted in src/main.tsx → src/App.tsx.
// Do NOT add navigation, providers, or business logic here.
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Outlet />,
});
