import { SettingsLayout } from "@/features/settings/components/settings-layout";
import { PasswordForm } from "@/features/settings/components/password-form";

const SettingsPassword = () => (
  <SettingsLayout
    title="Password"
    description="Change the password used to sign in to CollabSphere. Stronger passwords are harder to guess."
  >
    <PasswordForm />
  </SettingsLayout>
);

export default SettingsPassword;
