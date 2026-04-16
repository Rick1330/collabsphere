"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@collabsphere/ui/components/button";
import { cn } from "@collabsphere/ui/lib/utils";

import {
  listWorkspaces,
  workspaceListQueryKey,
  type WorkspaceSummary,
} from "@/lib/api/workspaces";
import { getInitials, getWorkspaceTypeClasses } from "@/lib/format";

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", mark: "DB" },
  { href: "/workspaces", label: "Workspaces", mark: "WS" },
  { href: "/notifications", label: "Notifications", mark: "NT" },
  { href: "/settings/profile", label: "Settings", mark: "ST" },
] as const;

function isSidebarItemActive(pathname: string | null, href: (typeof navItems)[number]["href"]) {
  if (pathname === href) {
    return true;
  }

  return href === "/settings/profile" && Boolean(pathname?.startsWith("/settings"));
}

function AppSidebarHeader({
  collapsed,
  onToggle,
}: Readonly<Pick<AppSidebarProps, "collapsed" | "onToggle">>) {
  return (
    <div className={cn("flex items-center justify-between gap-3", collapsed && "justify-center")}>
      <Link href="/dashboard" className="flex min-w-0 items-center gap-3 no-underline">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-sm font-bold text-teal-700">
          CS
        </span>
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-stone-900">CollabSphere</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Workspace hub
            </span>
          </span>
        ) : null}
      </Link>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-sm text-stone-500 hover:text-stone-900"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggle}
      >
        {collapsed ? ">" : "<"}
      </button>
    </div>
  );
}

function AppSidebarNav({
  collapsed,
  pathname,
}: Readonly<{ collapsed: boolean; pathname: string | null }>) {
  return (
    <nav aria-label="Application routes" className="space-y-2">
      {navItems.map((item) => {
        const active = isSidebarItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2",
              active ? "bg-teal-50 font-semibold text-teal-700" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900",
              collapsed && "justify-center",
            )}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white font-mono text-[11px] text-stone-500 shadow-sm">
              {item.mark}
            </span>
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function RecentWorkspacesPanel({
  recentWorkspaces,
  isPending,
  isError,
  onRetry,
}: Readonly<{
  recentWorkspaces: readonly WorkspaceSummary[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}>) {
  if (isPending) {
    return (
      <div className="space-y-2 px-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-10 rounded-2xl bg-stone-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white px-3 py-4">
        <p className="text-sm font-medium text-stone-900">Workspace list unavailable</p>
        <p className="text-xs text-stone-500">Retry once the workspace endpoint is available.</p>
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recentWorkspaces.map((workspace) => {
        const tone = getWorkspaceTypeClasses(workspace.type);
        return (
          <Link
            key={workspace.id}
            href={`/w/${workspace.id}`}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", tone.dot)} aria-hidden="true" />
            <span className="min-w-0 truncate">{workspace.name}</span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
              {workspace.icon ?? getInitials(workspace.name, 1)}
            </span>
          </Link>
        );
      })}
      <Link href="/workspaces/new" className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-stone-400 transition hover:bg-stone-100 hover:text-teal-700">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white">+</span>
        <span>New workspace</span>
      </Link>
    </div>
  );
}

export function AppSidebar({ collapsed, onToggle }: Readonly<AppSidebarProps>) {
  const pathname = usePathname();
  const workspacesQuery = useQuery({
    queryKey: workspaceListQueryKey,
    queryFn: ({ signal }) => listWorkspaces({ signal }),
    retry: false,
    staleTime: 60_000,
  });
  const recentWorkspaces = (workspacesQuery.data ?? []).slice(0, 5);

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-stone-200 bg-stone-50 px-3 py-4 xl:flex xl:flex-col xl:gap-6",
        collapsed ? "xl:w-[72px]" : "xl:w-[272px]",
      )}
      aria-label="Primary navigation"
    >
      <AppSidebarHeader collapsed={collapsed} onToggle={onToggle} />
      <AppSidebarNav collapsed={collapsed} pathname={pathname} />

      {!collapsed ? (
        <section className="space-y-3">
          <p className="px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
            Recent workspaces
          </p>
          <RecentWorkspacesPanel
            isError={workspacesQuery.isError && !workspacesQuery.data}
            isPending={workspacesQuery.isPending && !workspacesQuery.data}
            onRetry={() => {
              workspacesQuery.refetch().catch(() => undefined);
            }}
            recentWorkspaces={recentWorkspaces}
          />
        </section>
      ) : null}
    </aside>
  );
}
