import type { ReactNode } from "react";

import { workspaceNavItems } from "../../../../components/foundation/navigation";
import { ShellFrame } from "../../../../components/foundation/shell-frame";

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
      navItems={workspaceNavItems(workspaceId)}
    >
      {children}
    </ShellFrame>
  );
}
