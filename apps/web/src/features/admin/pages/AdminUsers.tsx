import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminUsers } from "@/features/admin/components/admin-users";

const AdminUsersPage = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminUsers />
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminUsersPage;
