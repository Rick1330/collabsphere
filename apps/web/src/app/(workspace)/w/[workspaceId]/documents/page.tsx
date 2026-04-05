import { RoutePlaceholder } from "../../../../../components/foundation/route-placeholder";

type WorkspaceDocumentsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceDocumentsPage({
  params,
}: WorkspaceDocumentsPageProps) {
  const { workspaceId } = await params;

  return (
    <RoutePlaceholder
      title={`Workspace documents: ${workspaceId}`}
      summary="The documents area now has a truthful route foundation inside the workspace namespace."
      emptyState="Document empty states can now render in-place for empty workspaces or permission-limited listings without changing the route architecture."
      implementedNow={[
        "Stable /w/[workspaceId]/documents path",
        "Workspace-shell inheritance for future editor flows",
        "Foundation split between platform routing and collab features",
      ]}
      deferredWork={[
        "Document list and tree navigation",
        "Realtime editor and Hocuspocus integration",
        "Loading, empty, and error state variants backed by real data",
      ]}
    />
  );
}
