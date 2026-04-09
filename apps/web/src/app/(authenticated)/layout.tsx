import type { ReactNode } from "react";

import { CollapsibleShellFrame } from "../../components/foundation/collapsible-shell-frame";
import { GlobalSidebar } from "../../components/foundation/global-sidebar";
import { globalNavItems } from "../../components/foundation/navigation";
import { NotificationBell } from "../../components/foundation/notification-bell";
import { TopNavBar } from "../../components/foundation/top-nav-bar";
import { ThemeUserMenu } from "../../components/foundation/user-theme-menu";
import { WorkspaceSwitcher } from "../../components/foundation/workspace-switcher";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sectionLabel = "Authenticated global context";
  const title = "Personal workspace shell";
  const description =
    "Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features.";

  return (
    <CollapsibleShellFrame
      tone="global"
      sectionLabel={sectionLabel}
      title={title}
      description={description}
      sidebar={<GlobalSidebar />}
      topNav={
        <TopNavBar
          mobileMenuDescription={description}
          mobileMenuTitle={title}
          mobileNavItems={globalNavItems}
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
