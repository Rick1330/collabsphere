import { RoutePlaceholder } from "../../../../components/foundation/route-placeholder";

export default function CreateWorkspacePage() {
  return (
    <RoutePlaceholder
      title="Create workspace route"
      summary="The route exists so the top-nav workspace switcher can send members to a truthful creation entrypoint instead of a dead link."
      emptyState="Workspace creation flows can now layer onto a real route once form, template selection, and submission logic land."
      implementedNow={[
        "Stable /workspaces/new route under the authenticated shell",
        "Create-workspace CTA target for the workspace switcher dropdown",
        "Placeholder route ready for later creation flow work",
      ]}
      deferredWork={[
        "Workspace creation form and template selection",
        "Validation, submission, and idempotent create handling",
        "Post-create redirect and onboarding states",
      ]}
    />
  );
}
