import type { ReactNode } from "react";

import { CollapsibleShellFrame } from "../../../../components/foundation/collapsible-shell-frame";
import { NotificationBell } from "../../../../components/foundation/notification-bell";
import { TopNavBar } from "../../../../components/foundation/top-nav-bar";
import { ThemeUserMenu } from "../../../../components/foundation/user-theme-menu";
import { WorkspaceSwitcher } from "../../../../components/foundation/workspace-switcher";
import { WorkspaceSidebar } from "../../../../components/foundation/workspace-sidebar";
import { workspaceNavItems } from "../../../../components/foundation/navigation";

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
  const title = `Workspace ${workspaceId}`;
  const description =
    "Workspace-scoped routes now live under a dedicated dynamic layout boundary ready for membership-aware features.";

  return (
    <CollapsibleShellFrame
      tone="workspace"
      sectionLabel="Workspace context"
      title={title}
      description={description}
      sidebar={<WorkspaceSidebar workspaceId={workspaceId} />}
      topNav={
        <TopNavBar
          mobileMenuDescription={description}
          mobileMenuTitle={title}
          mobileNavItems={workspaceNavItems(workspaceId)}
          notificationBell={<NotificationBell />}
          workspaceSwitcher={<WorkspaceSwitcher />}
          userMenu={<ThemeUserMenu />}
        />
      }
    >
      {children}
    </CollapsibleShellFrame>
  );
}
