import { NavLink, Link } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  Activity,
  FolderOpen,
  BarChart3,
  LayoutTemplate,
  Settings,
  Lock,
  Plus,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkspaceForSidebar {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: "professional" | "academic" | "general";
  roleLabel: string;
  status: "active" | "archived";
  permissions: {
    canCreateContent: boolean;
    canEditSettings: boolean;
    canViewAnalytics: boolean;
  };
}

interface WorkspaceSidebarProps {
  workspace: WorkspaceForSidebar;
  collapsed: boolean;
  onToggle: () => void;
}

const typeBadge = (t: WorkspaceForSidebar["type"]) =>
  t === "professional"
    ? "bg-teal-50 text-teal-600 border-teal-200"
    : t === "academic"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-stone-100 text-stone-500 border-stone-200";

export const WorkspaceSidebar = ({ workspace, collapsed, onToggle }: WorkspaceSidebarProps) => {
  const base = `/w/${workspace.id}`;
  const NAV = [
    { to: base, label: "Overview", icon: LayoutDashboard, end: true },
    { to: `${base}/documents`, label: "Documents", icon: FileText },
    { to: `${base}/tasks`, label: "Tasks", icon: CheckSquare },
    { to: `${base}/members`, label: "Members", icon: Users },
    { to: `${base}/activity`, label: "Activity", icon: Activity },
    { to: `${base}/files`, label: "Files", icon: FolderOpen },
  ];

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 shrink-0 border-r border-stone-200 bg-[#FAFAF9]",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[60px]" : "w-[260px]",
      )}
      aria-label="Workspace navigation"
    >
      {/* Header */}
      <div className={cn("border-b border-stone-200/70", collapsed ? "px-2 py-3" : "px-3 py-3")}>
        <Link
          to="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-lg text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors",
            collapsed ? "justify-center h-8 w-8" : "px-2 py-1.5",
          )}
          aria-label="Back to dashboard"
          title={collapsed ? "Back to dashboard" : undefined}
        >
          <ArrowLeft className="h-4 w-4" />
          {!collapsed && <span>Back</span>}
        </Link>

        {!collapsed && (
          <div className="px-1 mt-3">
            <div className="flex items-center gap-2.5">
              {workspace.icon && (
                <span className="text-lg" aria-hidden="true">
                  {workspace.icon}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-stone-900 truncate">{workspace.name}</h2>
                {workspace.description && (
                  <p className="text-[11px] text-stone-500 truncate">{workspace.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  "text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border",
                  typeBadge(workspace.type),
                )}
              >
                {workspace.type}
              </span>
              <span className="font-mono text-[9px] text-stone-400 tracking-wider uppercase">
                {workspace.roleLabel}
              </span>
            </div>
          </div>
        )}

        {collapsed && workspace.icon && (
          <div className="flex justify-center mt-2 text-lg" aria-hidden="true">
            {workspace.icon}
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
                  end={item.end}
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

          {!collapsed && (
            <li className="pt-2 mt-2 border-t border-stone-200/70" aria-hidden="true" />
          )}

          {/* Analytics — Manager+ */}
          <li>
            {workspace.permissions.canViewAnalytics ? (
              <NavLink
                to={`${base}/analytics`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg text-sm transition-colors duration-150",
                    collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                    isActive
                      ? "text-teal-700 bg-teal-50 font-semibold border-l-2 border-teal-600"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-medium",
                  )
                }
                title={collapsed ? "Analytics" : undefined}
              >
                <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span>Analytics</span>}
              </NavLink>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm text-stone-400 cursor-not-allowed",
                  collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                )}
                title={collapsed ? "Analytics (locked)" : "Manager+ only"}
                aria-disabled="true"
              >
                <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span>Analytics</span>
                    <Lock className="h-3 w-3 ml-auto text-stone-300" aria-hidden="true" />
                  </>
                )}
              </div>
            )}
          </li>

          <li>
            <NavLink
              to={`${base}/templates`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg text-sm transition-colors duration-150",
                  collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                  isActive
                    ? "text-teal-700 bg-teal-50 font-semibold border-l-2 border-teal-600"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-medium",
                )
              }
              title={collapsed ? "Templates" : undefined}
            >
              <LayoutTemplate className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>Templates</span>}
            </NavLink>
          </li>

          <li>
            {workspace.permissions.canEditSettings ? (
              <NavLink
                to={`${base}/settings`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg text-sm transition-colors duration-150",
                    collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                    isActive
                      ? "text-teal-700 bg-teal-50 font-semibold border-l-2 border-teal-600"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-medium",
                  )
                }
                title={collapsed ? "Settings" : undefined}
              >
                <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm text-stone-400 cursor-not-allowed",
                  collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                )}
                title="Admin+ only"
                aria-disabled="true"
              >
                <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span>Settings</span>
                    <Lock className="h-3 w-3 ml-auto text-stone-300" aria-hidden="true" />
                  </>
                )}
              </div>
            )}
          </li>
        </ul>

        {/* Quick actions */}
        {!collapsed &&
          workspace.status === "active" &&
          workspace.permissions.canCreateContent && (
            <div className="mt-6">
              <div className="font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase mb-2 px-6">
                Quick actions
              </div>
              <ul className="px-3 space-y-0.5">
                <li>
                  <Link
                    to={`${base}/documents/new`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    New document
                  </Link>
                </li>
                <li>
                  <Link
                    to={`${base}/tasks/new`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    New task
                  </Link>
                </li>
              </ul>
            </div>
          )}
      </nav>

      {/* Collapse toggle */}
      <div
        className={cn(
          "border-t border-stone-200/70 p-2",
          collapsed ? "flex justify-center" : "px-3 py-2",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-150 text-xs",
            collapsed ? "h-8 w-8 justify-center" : "h-8 px-2 w-full",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};
