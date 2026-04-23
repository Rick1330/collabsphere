import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminAudit } from "@/features/admin/components/admin-audit";

const AdminAuditPage = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminAudit />
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminAuditPage;
