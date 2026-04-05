import { RoutePlaceholder } from "../../../components/foundation/route-placeholder";

export default function WorkspacesPage() {
  return (
    <RoutePlaceholder
      title="Workspace list route"
      summary="The route exists so workspace discovery and creation flows can be implemented against a real application shell."
      emptyState="Workspace-list empty states can now slot into a stable route shell once real membership data is wired in."
      implementedNow={[
        "Stable /workspaces route and shell inheritance",
        "Foundation section for global authenticated navigation",
        "Responsive route container for future list states",
      ]}
      deferredWork={[
        "Workspace listing data and filters",
        "Workspace creation flow and dialogs",
        "Notifications and recent activity surfaces",
      ]}
    />
  );
}
