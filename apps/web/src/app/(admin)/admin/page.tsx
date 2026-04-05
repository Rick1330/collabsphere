import { RoutePlaceholder } from "../../../components/foundation/route-placeholder";

export default function AdminPage() {
  return (
    <RoutePlaceholder
      title="Admin route"
      summary="The admin namespace now exists in the web runtime so later platform-admin stories do not need another routing reset."
      emptyState="Admin empty-state handling is now reserved for no-access, no-data, or unconfigured-platform variants once real admin data is wired in."
      implementedNow={[
        "Stable /admin route",
        "Dedicated admin layout boundary",
        "Baseline route shell for future restricted content",
      ]}
      deferredWork={[
        "Admin dashboards and audit tooling",
        "Role-aware admin access control beyond the foundation login redirect",
        "Platform management workflows and data integration",
      ]}
    />
  );
}
