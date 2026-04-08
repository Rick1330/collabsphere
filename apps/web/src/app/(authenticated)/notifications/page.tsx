import { RoutePlaceholder } from "../../../components/foundation/route-placeholder";

export default function NotificationsPage() {
  return (
    <RoutePlaceholder
      title="Notifications center route"
      summary="The route exists so the top-nav notification bell can link into a truthful authenticated destination while richer filtering and preference controls follow in later work."
      emptyState="Notification center loading, empty, and preference states can now extend from a stable authenticated route shell."
      implementedNow={[
        "Stable /notifications route and authenticated shell inheritance",
        "Top-nav notification bell destination for View all notifications",
        "Foundation route surface for later notification-center states",
      ]}
      deferredWork={[
        "Paginated notification center list and filters",
        "Notification preferences management",
        "Realtime updates and workspace-scoped filtering controls",
      ]}
    />
  );
}
