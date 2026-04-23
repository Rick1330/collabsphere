// Defensive catch-all stub. See src/routes/__root.tsx for context.
// The real catch-all is handled by react-router-dom in src/App.tsx.
import { createFileRoute } from "@tanstack/react-router";

const createAnyFileRoute = createFileRoute as unknown as (
  path: string,
) => (config: { component: () => null }) => unknown;

export const Route = createAnyFileRoute("$")({
  component: () => null,
});
