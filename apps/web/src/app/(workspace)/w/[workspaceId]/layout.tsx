import type { ReactNode } from "react";

import { ShellFrame } from "../../../../components/foundation/shell-frame";
import { ThemeUserMenu } from "../../../../components/foundation/user-theme-menu";
import { WorkspaceSidebar } from "../../../../components/foundation/workspace-sidebar";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  return (
    <ShellFrame
      tone="workspace"
      sectionLabel="Workspace context"
      title={`Workspace ${workspaceId}`}
      description="Workspace-scoped routes now live under a dedicated dynamic layout boundary ready for membership-aware features."
      collapsibleSidebar
      sidebar={<WorkspaceSidebar workspaceId={workspaceId} />}
      headerAction={<ThemeUserMenu />}
    >
      {children}
    </ShellFrame>
  );
}
