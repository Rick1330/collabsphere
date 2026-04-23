import { SettingsLayout } from "@/features/settings/components/settings-layout";
import { NotificationPrefs } from "@/features/settings/components/notification-prefs";

const SettingsNotifications = () => (
  <SettingsLayout
    title="Notifications"
    description="Control which channels deliver which event types — and whether you receive a daily or weekly digest."
  >
    <NotificationPrefs />
  </SettingsLayout>
);

export default SettingsNotifications;
