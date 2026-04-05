import type { ReactNode } from "react";

import { adminNavItems } from "../../../components/foundation/navigation";
import { ShellFrame } from "../../../components/foundation/shell-frame";

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
    >
      {children}
    </ShellFrame>
  );
}
