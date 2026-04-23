import { Link, NavLink } from "react-router-dom";
import {
  ArrowLeft,
  FolderOpen,
  LayoutDashboard,
  ScrollText,
  Settings as SettingsIcon,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const ADMIN_NAV: AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/workspaces", label: "Workspaces", icon: FolderOpen },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { to: "/admin/settings", label: "System", icon: SettingsIcon },
];

export const AdminNav = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-stone-200">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors mb-4
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-red-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-stone-900 block truncate">
              Admin Panel
            </span>
            <span className="font-mono text-[9px] text-stone-400 tracking-wider uppercase">
              PLATFORM ADMINISTRATION
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav aria-label="Admin navigation" className="flex-1 p-3">
        <ul className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
                      isActive
                        ? "bg-red-50 text-red-700 font-medium"
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-50",
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-stone-100">
        <span className="font-mono text-[9px] text-stone-400 tracking-[0.15em] uppercase">
          COLLABSPHERE ADMIN v1.0
        </span>
      </div>
    </div>
  );
};
