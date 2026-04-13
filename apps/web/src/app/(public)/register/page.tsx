import { RoutePlaceholder } from "../../../components/shared/route-placeholder";

export default function RegisterPage() {
  return (
    <RoutePlaceholder
      title="Register route"
      summary="Account creation now has a dedicated route boundary inside the App Router foundation."
      emptyState="This route now includes an explicit empty-state slot for invite-only or verification-waiting registration variants."
      implementedNow={[
        "Stable /register route on the public shell",
        "Reusable placeholder presentation contract",
        "Responsive layout inheritance from the public group",
      ]}
      deferredWork={[
        "Registration form UX and validation",
        "Verification and invite acceptance flows",
        "Onboarding transitions and analytics hooks",
      ]}
    />
  );
}
