import { useParams, Navigate } from "react-router-dom";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminUserDetailView } from "@/features/admin/components/admin-user-detail";

const AdminUserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return <Navigate to="/admin/users" replace />;
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <AdminUserDetailView userId={userId} />
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminUserDetailPage;
