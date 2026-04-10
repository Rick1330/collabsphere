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
    <nav className="top-nav" aria-label="Authenticated top navigation">
      <div className="top-nav__brand-cluster">
        <div className="top-nav__brand-row">
          <MobileMenu
            description={mobileMenuDescription}
            initialOpen={mobileMenuInitialOpen}
            navItems={mobileNavItems}
            title={mobileMenuTitle}
          />
          <Link className="top-nav__brand" href="/dashboard">
            <span className="top-nav__brand-mark" aria-hidden="true">
              CS
            </span>
            <span className="top-nav__brand-copy">
              <span className="top-nav__brand-label">CollabSphere</span>
              <span className="top-nav__brand-meta">Workspace command center</span>
            </span>
          </Link>
        </div>
        <p className="top-nav__context-note">
          Authenticated global shell with collaboration controls staged in place.
        </p>
      </div>

      <div className="top-nav__workspace-slot" role="group" aria-label="Workspace controls">
        {workspaceSwitcher}
      </div>

      <TopNavCommandPalette initialOpen={commandPaletteInitialOpen} />

      <div className="top-nav__actions" role="group" aria-label="Notification and account controls">
        {notificationBell}
        <div className="top-nav__user-slot">{userMenu}</div>
      </div>
    </nav>
  );
}
