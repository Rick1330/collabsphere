import { SettingsLayout } from "@/features/settings/components/settings-layout";
import { AppearanceForm } from "@/features/settings/components/appearance-form";

const SettingsAppearance = () => (
  <SettingsLayout
    title="Appearance"
    description="Pick your preferred theme. CollabSphere remembers your choice on this device."
  >
    <AppearanceForm />
  </SettingsLayout>
);

export default SettingsAppearance;
