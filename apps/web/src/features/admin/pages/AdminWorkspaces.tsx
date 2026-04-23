import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminWorkspaces } from "@/features/admin/components/admin-workspaces";

const AdminWorkspacesPage = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminWorkspaces />
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminWorkspacesPage;
