import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminSettings } from "@/features/admin/components/admin-settings";

const AdminSettingsPage = () => (
  <AdminGuard>
    <AdminLayout>
      <AdminSettings />
    </AdminLayout>
  </AdminGuard>
);

export default AdminSettingsPage;
