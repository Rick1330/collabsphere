import { NavLink, useLocation } from "react-router-dom";
import { User, KeyRound, Bell, Palette, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

const SETTINGS_NAV: NavItem[] = [
  { href: "/settings/profile", label: "Profile", hint: "Name, bio, avatar", icon: User },
  { href: "/settings/password", label: "Password", hint: "Sign-in & security", icon: KeyRound },
  { href: "/settings/notifications", label: "Notifications", hint: "Channels & digests", icon: Bell },
  { href: "/settings/appearance", label: "Appearance", hint: "Theme & density", icon: Palette },
];

export const SettingsNav = () => {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Settings navigation" className="md:w-56 md:shrink-0">
      {/* Desktop */}
      <ul className="hidden md:flex md:flex-col md:gap-1">
        {SETTINGS_NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <NavLink
                to={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-1",
                  isActive
                    ? "bg-white border border-stone-200 text-stone-900 font-semibold shadow-sm"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 border border-transparent font-medium",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 mt-0.5",
                    isActive
                      ? "text-teal-600"
                      : "text-stone-400 group-hover:text-stone-600",
                  )}
                  aria-hidden="true"
                />
                <span className="flex flex-col min-w-0 leading-tight">
                  <span className="truncate">{item.label}</span>
                  <span
                    className={cn(
                      "text-[10.5px] mt-0.5 font-normal",
                      isActive ? "text-stone-500" : "text-stone-400",
                    )}
                  >
                    {item.hint}
                  </span>
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* Mobile pills */}
      <div className="md:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
        <ul className="flex gap-2 pb-1 min-w-max">
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-1",
                    isActive
                      ? "bg-stone-900 border-stone-900 text-white font-semibold"
                      : "bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300 font-medium",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
