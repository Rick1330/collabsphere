import { Link, useNavigate } from "react-router-dom";
import { Bell, ClipboardCheck, Keyboard, Menu, Search, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebarContent } from "./app-sidebar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { getInitials } from "@/lib/format";
import { useCurrentAccount } from "@/lib/auth-session";
import { getSessionRole } from "@/lib/session-role";
import { logout } from "@/api/adapters/auth";
import { emitOpenHelp } from "@/lib/shortcut-events";

interface TopNavProps {
  /** Optional user override — when omitted, the signed-in account is used. */
  user?: { fullName: string; email: string };
  unreadCount?: number;
  onOpenPalette: () => void;
}

export const TopNav = ({ user: userOverride, unreadCount = 3, onOpenPalette }: TopNavProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const account = useCurrentAccount();
  const sessionRole = getSessionRole(account);
  const user =
    userOverride ??
    (account
      ? { fullName: account.fullName, email: account.email }
      : { fullName: "Guest", email: "" });

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur border-b border-stone-200">
      <div className="h-full flex items-center gap-3 px-4 sm:px-6">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] border-r border-stone-200">
            <MobileSidebarContent />
          </SheetContent>
        </Sheet>

        {/* Workspace switcher */}
        <WorkspaceSwitcher />

        {/* Search trigger */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex-1 max-w-md h-9 mx-auto px-3 rounded-lg
            border border-stone-200 bg-stone-50 hover:bg-white hover:border-stone-300
            text-sm text-stone-400 transition-colors
            flex items-center gap-2
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4 text-stone-400" />
          <span className="hidden sm:inline">Search or press</span>
          <span className="sm:hidden">Search</span>
          <kbd className="hidden sm:inline-flex ml-auto items-center justify-center px-1.5 py-0.5 rounded
            bg-white border border-stone-200 border-b-2 border-b-stone-300
            font-mono text-[10px] text-stone-500">
            ⌘K
          </kbd>
        </button>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {sessionRole.canReview && !sessionRole.isPlatformAdmin && (
            <Link
              to="/review"
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 text-stone-600 hover:text-amber-700 text-xs font-medium transition-colors"
              title="Open review queue"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span className="hidden lg:inline font-mono tracking-wide uppercase text-[10px]">
                Review
              </span>
            </Link>
          )}
          {sessionRole.isPlatformAdmin && (
            <Link
              to="/admin"
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-stone-200 hover:border-red-300 hover:bg-red-50/50 text-stone-600 hover:text-red-700 text-xs font-medium transition-colors"
              title="Open admin console"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden lg:inline font-mono tracking-wide uppercase text-[10px]">
                Admin
              </span>
            </Link>
          )}
          <Link
            to="/notifications"
            className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center
                  ring-2 ring-transparent hover:ring-teal-200 transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
                aria-label="Open user menu"
              >
                {getInitials(user.fullName, 2)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-stone-200">
              <div className="px-2 py-1.5">
                <div className="text-sm font-semibold text-stone-900 truncate">{user.fullName}</div>
                <div className="text-xs text-stone-500 truncate">{user.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-sm cursor-pointer">
                <Link to="/settings/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-sm cursor-pointer">
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-sm cursor-pointer">
                <Link to="/settings/appearance">Theme</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => emitOpenHelp()}
                className="text-sm cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Keyboard className="h-3.5 w-3.5 text-stone-500" />
                  Keyboard shortcuts
                </span>
                <kbd className="font-mono text-[10px] text-stone-400 px-1 rounded bg-stone-100 border border-stone-200">
                  ?
                </kbd>
              </DropdownMenuItem>
              {account?.globalRole === "ADMIN" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-sm cursor-pointer">
                    <Link to="/admin" className="flex items-center gap-2 text-red-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Admin console
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-sm text-red-600 cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
