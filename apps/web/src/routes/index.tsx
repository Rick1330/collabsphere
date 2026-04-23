// Defensive stub. See src/routes/__root.tsx for context.
// The real "/" route is defined in src/App.tsx via react-router-dom.
import { createFileRoute } from "@tanstack/react-router";

const createAnyFileRoute = createFileRoute as unknown as (
  path: string,
) => (config: { component: () => null }) => unknown;

export const Route = createAnyFileRoute("/")({
  component: () => null,
});
