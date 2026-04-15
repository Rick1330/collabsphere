"use client";

import type { ReactNode } from "react";

import { useDesktopSidebarMode } from "./use-desktop-sidebar-mode";
import { useDesktopSidebarShortcut } from "./use-desktop-sidebar-shortcut";
import { AppSidebar } from "./app-sidebar";
import { TopNav } from "./top-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: Readonly<AppShellProps>) {
  const { sidebarMode, toggleSidebarMode } = useDesktopSidebarMode({ enabled: true });
  useDesktopSidebarShortcut({ enabled: true, onToggle: toggleSidebarMode });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <AppSidebar collapsed={sidebarMode === "collapsed"} onToggle={toggleSidebarMode} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
