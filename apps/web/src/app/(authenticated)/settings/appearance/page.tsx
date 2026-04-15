import { AppearancePanel } from "../../../../components/settings/appearance-panel";

export default function AppearanceSettingsPage() {
  // AppearancePanel owns the only meaningful state here because theme preference is client-local.
  return <AppearancePanel />;
}
