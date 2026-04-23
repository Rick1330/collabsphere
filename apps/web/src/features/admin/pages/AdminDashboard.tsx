import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

const AdminDashboardPage = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminDashboardPage;
