import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminWorkspaceDetail } from "@/features/admin/components/admin-workspace-detail";
import { Navigate, useParams } from "react-router-dom";

const AdminWorkspaceDetailPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  if (!workspaceId) return <Navigate to="/admin/workspaces" replace />;
  return (
    <AdminGuard>
      <AdminLayout>
        <AdminWorkspaceDetail workspaceId={workspaceId} />
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminWorkspaceDetailPage;
