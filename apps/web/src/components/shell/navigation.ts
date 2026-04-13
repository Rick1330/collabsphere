import type { WorkspaceRole, WorkspaceSummary } from "../../lib/api/workspaces";

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

export type WorkspaceSidebarItem = {
  href: string;
  label: string;
  description: string;
  mark: string;
  requiredRole?: WorkspaceRole;
  matchMode?: "exact" | "prefix";
  status?: "live" | "staged";
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

const workspaceRoleOrder: Record<WorkspaceRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MANAGER: 2,
  MEMBER: 3,
  VIEWER: 4,
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

export const isWorkspaceRoleAllowed = (
  role: WorkspaceRole,
  minimumRole: WorkspaceRole,
) => workspaceRoleOrder[role] <= workspaceRoleOrder[minimumRole];

export const getWorkspaceRoleGateLabel = (minimumRole: WorkspaceRole) => {
  if (minimumRole === "OWNER") {
    return "Owner+";
  }

  if (minimumRole === "MANAGER") {
    return "Manager+";
  }

  if (minimumRole === "ADMIN") {
    return "Admin+";
  }

  if (minimumRole === "MEMBER") {
    return "Member+";
  }

  if (minimumRole === "VIEWER") {
    return "Viewer+";
  }

  const exhaustiveRole: never = minimumRole;
  return exhaustiveRole;
};

export const getWorkspaceInitials = (
  workspace: Pick<WorkspaceSummary, "icon" | "name">,
) => {
  if (workspace.icon) {
    return workspace.icon;
  }

  const initials = workspace.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "WS";
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

export const workspaceSidebarPrimaryItems = (
  workspaceId: string,
): readonly WorkspaceSidebarItem[] => [
  {
    href: `/w/${workspaceId}`,
    label: "Overview",
    description: "Workspace home and summary surface.",
    mark: "OV",
  },
  {
    href: `/w/${workspaceId}/documents`,
    label: "Documents",
    description: "Document list and future tree foundation.",
    mark: "DC",
    matchMode: "prefix",
  },
  {
    href: `/w/${workspaceId}/tasks`,
    label: "Tasks",
    description: "Workspace task board namespace.",
    mark: "TK",
    matchMode: "prefix",
  },
  {
    href: `/w/${workspaceId}/members`,
    label: "Members",
    description: "Member directory route foundation is staged in a later baton.",
    mark: "MB",
    status: "staged",
  },
  {
    href: `/w/${workspaceId}/activity`,
    label: "Activity",
    description: "Workspace activity feed route lands later.",
    mark: "AC",
    status: "staged",
  },
  {
    href: `/w/${workspaceId}/files`,
    label: "Files",
    description: "Workspace file browser route lands later.",
    mark: "FL",
    status: "staged",
  },
];

export const workspaceSidebarSecondaryItems = (
  workspaceId: string,
): readonly WorkspaceSidebarItem[] => [
  {
    href: `/w/${workspaceId}/analytics`,
    label: "Analytics",
    description: "Manager-plus workspace insights route.",
    mark: "AN",
    requiredRole: "MANAGER",
    status: "staged",
  },
  {
    href: `/w/${workspaceId}/templates`,
    label: "Templates",
    description: "Reusable workspace templates route lands later.",
    mark: "TP",
    status: "staged",
  },
  {
    href: `/w/${workspaceId}/settings`,
    label: "Settings",
    description: "Admin-only workspace settings route.",
    mark: "ST",
    requiredRole: "ADMIN",
    status: "staged",
  },
];

export const workspaceSidebarQuickActionItems = (
  workspaceId: string,
): readonly WorkspaceSidebarItem[] => [
  {
    href: `/w/${workspaceId}/documents/new`,
    label: "New Document",
    description: "Document creation flow will connect in a later baton.",
    mark: "+D",
    requiredRole: "MEMBER",
    status: "staged",
  },
  {
    href: `/w/${workspaceId}/tasks/new`,
    label: "New Task",
    description: "Task creation flow will connect in a later baton.",
    mark: "+T",
    requiredRole: "MEMBER",
    status: "staged",
  },
];

export const isWorkspaceSidebarItemActive = (
  currentPathname: string | null | undefined,
  item: Pick<WorkspaceSidebarItem, "href" | "matchMode">,
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

export const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Admin",
    hint: "Platform administration foundation",
  },
];

