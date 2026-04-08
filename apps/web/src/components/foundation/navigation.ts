export type NavItem = {
  href: string;
  label: string;
  hint: string;
};

export type GlobalSidebarItem = {
  href: string;
  label: string;
  description: string;
  mark: string;
  tag: string;
  matchMode?: "exact" | "prefix";
};

export const publicNavItems: NavItem[] = [
  {
    href: "/",
    label: "Landing",
    hint: "Public product narrative and transition status",
  },
  {
    href: "/login",
    label: "Login",
    hint: "Future auth entrypoint",
  },
  {
    href: "/register",
    label: "Register",
    hint: "Future account creation entrypoint",
  },
];

export const globalNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    hint: "Authenticated global home",
  },
  {
    href: "/workspaces",
    label: "Workspaces",
    hint: "Workspace switcher and listing surface",
  },
  {
    href: "/notifications",
    label: "Notifications",
    hint: "Full notification history and future filters",
  },
  {
    href: "/settings",
    label: "Settings",
    hint: "Account-level settings shell",
  },
  {
    href: "/settings/profile",
    label: "Profile",
    hint: "Nested settings route foundation",
  },
];

export const globalSidebarPrimaryItems: readonly GlobalSidebarItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Global home and recent collaboration context.",
    mark: "DB",
    tag: "Home",
  },
  {
    href: "/workspaces",
    label: "Workspaces",
    description: "List and revisit your available workspaces.",
    mark: "WS",
    tag: "List",
  },
  {
    href: "/notifications",
    label: "Notifications",
    description: "Review your full notification history outside the bell menu.",
    mark: "NT",
    tag: "Feed",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Account, profile, and future preference surfaces.",
    mark: "ST",
    tag: "Prefs",
    matchMode: "prefix",
  },
];

export const globalSidebarActionItems: readonly GlobalSidebarItem[] = [
  {
    href: "/workspaces/new",
    label: "New Workspace",
    description: "Start a fresh workspace without leaving the authenticated shell.",
    mark: "NW",
    tag: "Create",
  },
];

const normalizePathname = (pathname: string): string => {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

export const isGlobalSidebarItemActive = (
  currentPathname: string | null | undefined,
  item: Pick<GlobalSidebarItem, "href" | "matchMode">,
): boolean => {
  if (currentPathname == null) {
    return false;
  }

  const normalizedCurrentPathname = normalizePathname(currentPathname);
  const normalizedHref = normalizePathname(item.href);

  if (item.matchMode === "prefix") {
    return (
      normalizedCurrentPathname === normalizedHref ||
      normalizedCurrentPathname.startsWith(`${normalizedHref}/`)
    );
  }

  return normalizedCurrentPathname === normalizedHref;
};

export const workspaceNavItems = (workspaceId: string): NavItem[] => [
  {
    href: `/w/${workspaceId}`,
    label: "Overview",
    hint: "Workspace landing shell",
  },
  {
    href: `/w/${workspaceId}/documents`,
    label: "Documents",
    hint: "Document area routing foundation",
  },
  {
    href: `/w/${workspaceId}/tasks`,
    label: "Tasks",
    hint: "Task area routing foundation",
  },
];

export const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Admin",
    hint: "Platform administration foundation",
  },
];

