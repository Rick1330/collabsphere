"use client";

import { MobileMenu } from "./mobile-menu";
import { globalNavItems } from "./navigation";
import { NotificationBell } from "./notification-bell";
import { TopNavCommandPalette } from "./top-nav-command-palette";
import { ThemeUserMenu } from "./user-theme-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="xl:hidden">
          <MobileMenu
            description="Global authenticated navigation"
            navItems={globalNavItems}
            title="CollabSphere navigation"
          />
        </div>
        <div className="min-w-0 flex-1 lg:max-w-[18rem]">
          <WorkspaceSwitcher />
        </div>
        <div className="hidden flex-1 lg:block">
          <TopNavCommandPalette />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <ThemeUserMenu />
        </div>
      </div>
    </header>
  );
}

