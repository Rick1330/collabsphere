import Link from "next/link";
import * as React from "react";

import { MobileMenu } from "./mobile-menu";
import type { NavItem } from "./navigation";
import { TopNavCommandPalette } from "./top-nav-command-palette";

type TopNavBarProps = {
  commandPaletteInitialOpen?: boolean;
  mobileMenuDescription: string;
  mobileMenuInitialOpen?: boolean;
  mobileMenuTitle: string;
  mobileNavItems: NavItem[];
  notificationBell: React.ReactNode;
  workspaceSwitcher: React.ReactNode;
  userMenu: React.ReactNode;
};

const topNavSurfaceStyle = {
  borderColor: `color-mix(in srgb, var(--section-accent, var(--color-accent)) 18%, var(--color-border))`,
  background: `linear-gradient(
    135deg,
    color-mix(in srgb, var(--surface-card) 94%, var(--surface-card-subtle)) 0%,
    color-mix(in srgb, var(--surface-card-subtle) 86%, var(--section-accent, var(--color-accent))) 100%
  )`,
  boxShadow: "var(--shadow-elevated)",
  backdropFilter: "blur(18px)",
  gridTemplateAreas: `"brand workspace search actions"`,
} satisfies React.CSSProperties;

export function TopNavBar({
  commandPaletteInitialOpen = false,
  mobileMenuDescription,
  mobileMenuInitialOpen = false,
  mobileMenuTitle,
  mobileNavItems,
  notificationBell,
  workspaceSwitcher,
  userMenu,
}: TopNavBarProps) {
  return (
    <nav
      className="top-nav sticky top-4 z-[6] grid grid-cols-[minmax(0,1.1fr)_minmax(14rem,18rem)_minmax(18rem,1fr)_auto] items-center gap-4 rounded-[1.45rem] border px-[1.1rem] py-4"
      style={topNavSurfaceStyle}
      aria-label="Authenticated top navigation"
    >
      <div className="top-nav__brand-cluster grid min-w-0 gap-[0.45rem]" style={{ gridArea: "brand" }}>
        <div className="top-nav__brand-row grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <MobileMenu
            description={mobileMenuDescription}
            initialOpen={mobileMenuInitialOpen}
            navItems={mobileNavItems}
            title={mobileMenuTitle}
          />
          <Link
            className="top-nav__brand grid max-w-fit grid-cols-[auto_minmax(0,1fr)] items-center gap-3 no-underline"
            href="/dashboard"
          >
            <span className="top-nav__brand-mark" aria-hidden="true">
              CS
            </span>
            <span className="top-nav__brand-copy">
              <span className="top-nav__brand-label">CollabSphere</span>
              <span className="top-nav__brand-meta">Workspace command center</span>
            </span>
          </Link>
        </div>
        <p className="top-nav__context-note m-0 max-w-[40ch] text-[0.9rem] text-[color:var(--color-text-secondary)]">
          Authenticated global shell with collaboration controls staged in place.
        </p>
      </div>

      <div
        className="top-nav__workspace-slot"
        style={{ gridArea: "workspace" }}
        role="group"
        aria-label="Workspace controls"
      >
        {workspaceSwitcher}
      </div>

      <TopNavCommandPalette initialOpen={commandPaletteInitialOpen} />

      <div
        className="top-nav__actions flex items-center justify-end gap-3"
        style={{ gridArea: "actions" }}
        role="group"
        aria-label="Notification and account controls"
      >
        {notificationBell}
        <div className="top-nav__user-slot min-w-0">{userMenu}</div>
      </div>
    </nav>
  );
}
