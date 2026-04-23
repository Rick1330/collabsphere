import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Bell,
  Settings,
  Plus,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentWorkspace {
  id: string;
  name: string;
  type: "professional" | "academic" | "general";
}

const RECENT: RecentWorkspace[] = [
  { id: "alpha", name: "Project Alpha", type: "professional" },
  { id: "thesis", name: "Thesis — Distributed Systems", type: "academic" },
  { id: "personal", name: "Personal Notes", type: "general" },
];

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workspaces", label: "Workspaces", icon: Briefcase },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

const dotColor = (t: RecentWorkspace["type"]) =>
  t === "professional"
    ? "bg-teal-500"
    : t === "academic"
    ? "bg-amber-500"
    : "bg-stone-400";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 shrink-0",
        "border-r border-stone-200 bg-[#FAFAF9]",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[60px]" : "w-[260px]",
      )}
      aria-label="Primary navigation"
    >
      {/* Header */}
      <div className={cn("h-14 flex items-center border-b border-stone-200/70", collapsed ? "justify-center px-2" : "px-4")}>
        {collapsed ? (
          <div className="h-7 w-7 rounded-md bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
            CS
          </div>
        ) : (
          <div className="flex flex-col leading-tight">
            <span className="text-stone-900 font-bold text-sm tracking-tight">CollabSphere</span>
            <span className="font-mono text-[10px] text-stone-400 tracking-[0.15em] mt-0.5">WORKSPACE HUB</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-lg text-sm transition-colors duration-150",
                      collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                      isActive
                        ? "text-teal-700 bg-teal-50 font-semibold border-l-2 border-teal-600"
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-medium",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-1",
                    )
                  }
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <div className="mt-6">
            <div className="font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase mb-2 px-6">
              Recent workspaces
            </div>
            <ul className="px-3 space-y-0.5">
              {RECENT.map((w) => (
                <li key={w.id}>
                  <Link
                    to={`/w/${w.id}`}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-stone-600
                      hover:text-stone-900 hover:bg-stone-100 transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-1"
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor(w.type))} aria-hidden="true" />
                    <span className="truncate">{w.name}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/workspaces/new"
                  className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-stone-400 hover:text-teal-600 transition-colors duration-150"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  New workspace
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className={cn("border-t border-stone-200/70 p-2", collapsed ? "flex justify-center" : "px-3 py-2")}>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100",
            "transition-colors duration-150 text-xs",
            collapsed ? "h-8 w-8 justify-center" : "h-8 px-2 w-full",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-1",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={`${collapsed ? "Expand" : "Collapse"} sidebar (⌘B)`}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && (
            <>
              <span>Collapse</span>
              <kbd className="ml-auto inline-flex items-center justify-center h-4 px-1 rounded bg-white border border-stone-200 font-mono text-[10px] text-stone-500">
                ⌘B
              </kbd>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

// Mobile sidebar wrapped in a Sheet — exported separately
export const MobileSidebarContent = () => {
  const [, force] = useState(0);
  return (
    <div className="flex flex-col h-full bg-[#FAFAF9]">
      <div className="h-14 flex items-center px-4 border-b border-stone-200">
        <div className="flex flex-col leading-tight">
          <span className="text-stone-900 font-bold text-sm tracking-tight">CollabSphere</span>
          <span className="font-mono text-[10px] text-stone-400 tracking-[0.15em] mt-0.5">WORKSPACE HUB</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3" onClick={() => force((n) => n + 1)}>
        <ul className="space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "text-teal-700 bg-teal-50 font-semibold border-l-2 border-teal-600"
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-medium",
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          <div className="font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase mb-2 px-6">
            Recent workspaces
          </div>
          <ul className="px-3 space-y-0.5">
            {RECENT.map((w) => (
              <li key={w.id}>
                <Link
                  to={`/w/${w.id}`}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-stone-600 hover:bg-stone-100"
                >
                  <span className={cn("h-2 w-2 rounded-full", dotColor(w.type))} />
                  <span className="truncate">{w.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};
