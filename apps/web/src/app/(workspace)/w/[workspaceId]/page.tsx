import { RoutePlaceholder } from "../../../../components/foundation/route-placeholder";

type WorkspacePageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;

  return (
    <RoutePlaceholder
      title={`Workspace home: ${workspaceId}`}
      summary="This dynamic segment locks in the workspace route namespace and layout boundary for downstream document, task, and member stories."
      emptyState="Workspace home now reserves an explicit empty-state presentation area for no-content or no-membership variants once data wiring lands."
      implementedNow={[
        "Dynamic /w/[workspaceId] segment",
        "Workspace-specific shell and navigation seed",
        "Shared foundation for deeper workspace routes",
      ]}
      deferredWork={[
        "Workspace membership and RBAC enforcement",
        "Workspace dashboard data and summary cards",
        "Story #37 breadcrumbs and route context polish",
      ]}
    />
  );
}
