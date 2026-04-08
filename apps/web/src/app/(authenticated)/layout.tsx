import type { ReactNode } from "react";

import { globalNavItems } from "../../components/foundation/navigation";
import { ShellFrame } from "../../components/foundation/shell-frame";
import { TopNavBar } from "../../components/foundation/top-nav-bar";
import { ThemeUserMenu } from "../../components/foundation/user-theme-menu";
import { WorkspaceSwitcher } from "../../components/foundation/workspace-switcher";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ShellFrame
      tone="global"
      sectionLabel="Authenticated global context"
      title="Personal workspace shell"
      description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
      navItems={globalNavItems}
      topNav={
        <TopNavBar
          workspaceSwitcher={<WorkspaceSwitcher />}
          userMenu={<ThemeUserMenu />}
        />
      }
    >
      {children}
    </ShellFrame>
  );
}
