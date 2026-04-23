import { SettingsLayout } from "@/features/settings/components/settings-layout";
import { ProfileForm } from "@/features/settings/components/profile-form";

const SettingsProfile = () => (
  <SettingsLayout
    title="Profile"
    description="How your name, bio, and avatar appear across every workspace you belong to."
  >
    <ProfileForm />
  </SettingsLayout>
);

export default SettingsProfile;
