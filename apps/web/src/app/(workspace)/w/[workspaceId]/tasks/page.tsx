import { RoutePlaceholder } from "../../../../../components/foundation/route-placeholder";

type WorkspaceTasksPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceTasksPage({
  params,
}: WorkspaceTasksPageProps) {
  const { workspaceId } = await params;

  return (
    <RoutePlaceholder
      title={`Workspace tasks: ${workspaceId}`}
      summary="The tasks area now exists as a real route segment for future Kanban and list experiences."
      emptyState="Task empty states can now render directly inside the route foundation for empty boards or filtered-no-result variants."
      implementedNow={[
        "Stable /w/[workspaceId]/tasks path",
        "Workspace route inheritance and responsive layout baseline",
        "Clear boundary for later query/mutation work",
      ]}
      deferredWork={[
        "Task board and task list feature delivery",
        "Keyboard shortcuts and command palette integration",
        "Optimistic mutations and activity/notification wiring",
      ]}
    />
  );
}
