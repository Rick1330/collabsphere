/**
 * Seeded mock accounts for the demo/dev login flow.
 *
 * These are the canonical "users that exist" in the mock world. The login
 * form authenticates against this list. Each account has credentials, a
 * coherent profile, a global role, and a default workspace context so we
 * can exercise the full role/type/scenario matrix end-to-end.
 *
 * Permission roles are the canonical 5: OWNER / ADMIN / MANAGER / MEMBER /
 * VIEWER. STUDENT / SUPERVISOR are domain personas mapped onto MEMBER /
 * MANAGER respectively (academic display labels live in `role-labels.ts`).
 *
 * IMPORTANT: This is mock-only. Passwords live in plaintext on purpose so
 * the demo accounts panel can reveal them. Do not copy this pattern into
 * any real auth implementation.
 */

import type { GlobalRole, WorkspaceRoleKey, WorkspaceType } from "@/lib/persona-scenario";

export type AuthProvider = "local" | "google";

export type AccountStatus = "active" | "unverified" | "disabled";

export interface MockAccount {
  id: string;
  email: string;
  password: string;
  fullName: string;
  initials: string;
  bio: string | null;
  avatarUrl: string | null;
  globalRole: GlobalRole;
  authProvider: AuthProvider;
  status: AccountStatus;
  /** Default workspace this user lands in after sign-in. */
  defaultWorkspaceId: string;
  defaultWorkspaceType: WorkspaceType;
  defaultWorkspaceRole: WorkspaceRoleKey;
  /** One-line context blurb for the demo accounts panel. */
  blurb: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: "u_jane",
    email: "elshaday@collabsphere.app",
    password: "Demo1234!",
    fullName: "Elshaday Tesfaye",
    initials: "ET",
    bio: "Full-stack developer passionate about collaboration tools.",
    avatarUrl: null,
    globalRole: "ADMIN",
    authProvider: "local",
    status: "active",
    defaultWorkspaceId: "alpha",
    defaultWorkspaceType: "professional",
    defaultWorkspaceRole: "OWNER",
    blurb: "Platform admin & workspace owner",
  },
  {
    id: "u_eyob",
    email: "eyob@collabsphere.app",
    password: "Demo1234!",
    fullName: "Eyob Bekele",
    initials: "EB",
    bio: "Tech lead at Project Alpha. Loves clean APIs.",
    avatarUrl: null,
    globalRole: "USER",
    authProvider: "local",
    status: "active",
    defaultWorkspaceId: "alpha",
    defaultWorkspaceType: "professional",
    defaultWorkspaceRole: "ADMIN",
    blurb: "Tech Lead — professional workspace",
  },
  {
    id: "u_kidus",
    email: "kidus@collabsphere.app",
    password: "Demo1234!",
    fullName: "Kidus Alemu",
    initials: "KA",
    bio: "Project manager keeping shipping on track.",
    avatarUrl: null,
    globalRole: "USER",
    authProvider: "local",
    status: "active",
    defaultWorkspaceId: "alpha",
    defaultWorkspaceType: "professional",
    defaultWorkspaceRole: "MANAGER",
    blurb: "Project Manager",
  },
  {
    id: "u_hanna",
    email: "hanna@collabsphere.app",
    password: "Demo1234!",
    fullName: "Hanna Girma",
    initials: "HG",
    bio: "Frontend engineer & designer.",
    avatarUrl: null,
    globalRole: "USER",
    authProvider: "local",
    status: "active",
    defaultWorkspaceId: "alpha",
    defaultWorkspaceType: "professional",
    defaultWorkspaceRole: "MEMBER",
    blurb: "Member / contributor",
  },
  {
    id: "u_yonas",
    email: "yonas@stakeholder.io",
    password: "Demo1234!",
    fullName: "Yonas Tadesse",
    initials: "YT",
    bio: "External stakeholder reviewing deliverables.",
    avatarUrl: null,
    globalRole: "USER",
    authProvider: "local",
    status: "active",
    defaultWorkspaceId: "alpha",
    defaultWorkspaceType: "professional",
    defaultWorkspaceRole: "VIEWER",
    blurb: "Stakeholder — read-only viewer",
  },
  {
    id: "u_meron",
    email: "meron@university.edu",
    password: "Demo1234!",
    fullName: "Meron Hailu",
    initials: "MH",
    bio: "MSc student working on a distributed-systems thesis.",
    avatarUrl: null,
    globalRole: "USER",
    authProvider: "local",
    status: "active",
    defaultWorkspaceId: "thesis",
    defaultWorkspaceType: "academic",
    defaultWorkspaceRole: "STUDENT",
    blurb: "Student — academic workspace",
  },
  {
    id: "u_dawit",
    email: "dawit@university.edu",
    password: "Demo1234!",
    fullName: "Dr. Dawit Worku",
    initials: "DW",
    bio: "Faculty advisor reviewing student submissions.",
    avatarUrl: null,
    globalRole: "USER",
    authProvider: "local",
    status: "active",
    defaultWorkspaceId: "thesis",
    defaultWorkspaceType: "academic",
    defaultWorkspaceRole: "SUPERVISOR",
    blurb: "Supervisor / Advisor — academic review",
  },
  {
    id: "u_rahel",
    email: "rahel@collabsphere.app",
    password: "Demo1234!",
    fullName: "Rahel Mengistu",
    initials: "RM",
    bio: "Just signed up — verify email pending.",
    avatarUrl: null,
    globalRole: "USER",
    authProvider: "local",
    status: "unverified",
    defaultWorkspaceId: "personal",
    defaultWorkspaceType: "general",
    defaultWorkspaceRole: "OWNER",
    blurb: "Unverified account (test verify flow)",
  },
];

export function findAccountByEmail(email: string): MockAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return MOCK_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
}

export function findAccountById(id: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((a) => a.id === id);
}
