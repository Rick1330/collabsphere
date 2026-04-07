import type { ReactNode } from "react";

import { globalNavItems } from "../../components/foundation/navigation";
import { ShellFrame } from "../../components/foundation/shell-frame";
import { ThemeUserMenu } from "../../components/foundation/user-theme-menu";

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
      headerAction={<ThemeUserMenu />}
    >
      {children}
    </ShellFrame>
  );
}
