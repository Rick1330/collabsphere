import type { ReactNode } from "react";

import { adminNavItems } from "../../../components/shell/navigation";
import { ShellFrame } from "../../../components/shell/shell-frame";
import { ThemeUserMenu } from "../../../components/shell/user-theme-menu";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ShellFrame
      tone="admin"
      sectionLabel="Admin context"
      title="Platform administration"
      description="Administrative routes now have a dedicated layout boundary without claiming the full admin feature set already exists."
      navItems={adminNavItems}
      headerAction={<ThemeUserMenu />}
    >
      {children}
    </ShellFrame>
  );
}
