import type { ReactNode } from "react";

import { publicNavItems } from "@/components/foundation/navigation";
import { ShellFrame } from "@/components/foundation/shell-frame";

export default function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ShellFrame
      tone="public"
      sectionLabel="Public context"
      title="CollabSphere"
      description="Marketing and entry routes now sit on a real App Router foundation instead of a static placeholder."
      navItems={publicNavItems}
    >
      {children}
    </ShellFrame>
  );
}

