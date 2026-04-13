import { RoutePlaceholder } from "../../../../components/shared/route-placeholder";

export default function ProfileSettingsPage() {
  return (
    <RoutePlaceholder
      title="Profile settings route"
      summary="A nested settings path now exists so downstream account stories can land without changing the route architecture again."
      emptyState="Profile settings now surface an explicit empty-state slot for unconfigured profile data and onboarding-first accounts."
      implementedNow={[
        "Nested /settings/profile path",
        "Inherited authenticated layout and route loading/error boundaries",
        "Clear separation between platform pathing and future form work",
      ]}
      deferredWork={[
        "Profile form fields and avatar upload",
        "Validation, API mutations, and optimistic updates",
        "Saved-state messaging and permissions handling",
      ]}
    />
  );
}
