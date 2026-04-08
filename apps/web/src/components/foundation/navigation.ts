export type NavItem = {
  href: string;
  label: string;
  hint: string;
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

