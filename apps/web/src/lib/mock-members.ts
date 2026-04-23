// Mock workspace members + invitations API.
// Source of truth for the Members page; other surfaces reuse the same
// types so role labels, identities, and avatars stay consistent.

import { getWorkspaceRoleLabel, type WorkspaceTypeForLabels } from "@/lib/role-labels";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface WorkspaceMember {
  membershipId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  role: WorkspaceRole;
  /** Display label (e.g. "TECH LEAD" for ADMIN in professional workspaces). */
  roleLabel: string;
  joinedAt: string;
  lastAccessedAt: string | null;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  roleLabel: string;
  invitedBy: { id: string; fullName: string };
  createdAt: string;
  expiresAt: string;
  status: "pending" | "expired";
  /** Last time this invitation was resent. Drives rate-limit + UI hint. */
  lastResentAt?: string | null;
}

export interface ApiError extends Error {
  code?: string;
  requestId?: string;
}

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
};

export function getRoleLabel(role: WorkspaceRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function getRoleDescription(role: string): string {
  switch (role) {
    case "OWNER":
      return "Full control including ownership transfer and workspace deletion.";
    case "ADMIN":
      return "Can manage workspace settings, members, and all content.";
    case "MANAGER":
      return "Can manage tasks, assign work, and review documents.";
    case "MEMBER":
      return "Can create and edit documents and tasks.";
    case "VIEWER":
      return "Can view all content but cannot edit or create.";
    default:
      return "";
  }
}

/**
 * Role assignment policy (spec §5.2.6.3):
 *  - Owner can assign Admin / Manager / Member / Viewer (cannot create another Owner here).
 *  - Admin can assign up to Manager (no Admin, no Owner).
 *  - Everyone else cannot reassign roles.
 */
export function getAssignableRoles(currentUserRole: WorkspaceRole): WorkspaceRole[] {
  if (currentUserRole === "OWNER") return ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];
  if (currentUserRole === "ADMIN") return ["MANAGER", "MEMBER", "VIEWER"];
  return [];
}

const ROLE_ORDER: Record<WorkspaceRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MANAGER: 2,
  MEMBER: 3,
  VIEWER: 4,
};

export function sortMembers(members: WorkspaceMember[]): WorkspaceMember[] {
  return [...members].sort((a, b) => {
    const r = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
    if (r !== 0) return r;
    return a.user.fullName.localeCompare(b.user.fullName);
  });
}

// ---------------------------------------------------------------------------
// In-memory mock store (per workspace).
// ---------------------------------------------------------------------------

const day = 24 * 60 * 60 * 1000;
const iso = (msOffset: number) => new Date(Date.now() + msOffset).toISOString();

interface WorkspaceData {
  type: WorkspaceTypeForLabels;
  archived: boolean;
  members: WorkspaceMember[];
  invitations: PendingInvitation[];
}

function seed(): Record<string, WorkspaceData> {
  const jane = {
    id: "user-jane",
    fullName: "Elshaday Tesfaye",
    email: "jane@collabsphere.app",
    avatarUrl: null,
  };
  const sam = {
    id: "user-sam",
    fullName: "Samuel Haile",
    email: "sam@collabsphere.app",
    avatarUrl: null,
  };
  const bob = {
    id: "user-bob",
    fullName: "Eyob Bekele",
    email: "bob@collabsphere.app",
    avatarUrl: null,
  };
  const alice = {
    id: "user-alice",
    fullName: "Kidist Alemu",
    email: "alice@collabsphere.app",
    avatarUrl: null,
  };
  const mira = {
    id: "user-mira",
    fullName: "Hiwot Mengistu",
    email: "mira@collabsphere.app",
    avatarUrl: null,
  };
  const alex = {
    id: "user-alex",
    fullName: "Yonas Girma",
    email: "alex@collabsphere.app",
    avatarUrl: null,
  };
  const priya = {
    id: "user-priya",
    fullName: "Bethel Tekle",
    email: "priya@collabsphere.app",
    avatarUrl: null,
  };
  const tom = {
    id: "user-tom",
    fullName: "Tewodros Worku",
    email: "tom@collabsphere.app",
    avatarUrl: null,
  };

  // Additional realistic-density Ethiopian-named team members.
  const dawit = { id: "user-dawit", fullName: "Dawit Worku", email: "dawit@collabsphere.app", avatarUrl: null };
  const meron = { id: "user-meron", fullName: "Meron Hailu", email: "meron@collabsphere.app", avatarUrl: null };
  const naod = { id: "user-naod", fullName: "Naod Solomon", email: "naod@collabsphere.app", avatarUrl: null };
  const liya = { id: "user-liya", fullName: "Liya Abebe", email: "liya@collabsphere.app", avatarUrl: null };
  const fitsum = { id: "user-fitsum", fullName: "Fitsum Tadesse", email: "fitsum@collabsphere.app", avatarUrl: null };
  const sara = { id: "user-sara", fullName: "Sara Negash", email: "sara@collabsphere.app", avatarUrl: null };
  const robel = { id: "user-robel", fullName: "Robel Yohannes", email: "robel@collabsphere.app", avatarUrl: null };

  return {
    alpha: {
      type: "professional",
      archived: false,
      members: [
        {
          membershipId: "m-alpha-jane",
          user: jane,
          role: "OWNER",
          roleLabel: "OWNER",
          joinedAt: iso(-120 * day),
          lastAccessedAt: iso(-2 * 60 * 60 * 1000),
        },
        {
          membershipId: "m-alpha-sam",
          user: sam,
          role: "ADMIN",
          roleLabel: "TECH LEAD",
          joinedAt: iso(-95 * day),
          lastAccessedAt: iso(-day),
        },
        {
          membershipId: "m-alpha-bob",
          user: bob,
          role: "MANAGER",
          roleLabel: "PROJECT MANAGER",
          joinedAt: iso(-70 * day),
          lastAccessedAt: iso(-3 * 60 * 60 * 1000),
        },
        {
          membershipId: "m-alpha-alice",
          user: alice,
          role: "MEMBER",
          roleLabel: "DEVELOPER",
          joinedAt: iso(-40 * day),
          lastAccessedAt: iso(-30 * 60 * 1000),
        },
        {
          membershipId: "m-alpha-mira",
          user: mira,
          role: "MEMBER",
          roleLabel: "DEVELOPER",
          joinedAt: iso(-22 * day),
          lastAccessedAt: iso(-5 * 60 * 60 * 1000),
        },
        {
          membershipId: "m-alpha-alex",
          user: alex,
          role: "MEMBER",
          roleLabel: "DESIGNER",
          joinedAt: iso(-15 * day),
          lastAccessedAt: iso(-day - 60_000),
        },
        {
          membershipId: "m-alpha-priya",
          user: priya,
          role: "VIEWER",
          roleLabel: "STAKEHOLDER",
          joinedAt: iso(-9 * day),
          lastAccessedAt: iso(-2 * day),
        },
        {
          membershipId: "m-alpha-dawit",
          user: dawit,
          role: "MEMBER",
          roleLabel: "BACKEND ENGINEER",
          joinedAt: iso(-60 * day),
          lastAccessedAt: iso(-15 * 60 * 1000),
        },
        {
          membershipId: "m-alpha-meron",
          user: meron,
          role: "MEMBER",
          roleLabel: "QA ENGINEER",
          joinedAt: iso(-45 * day),
          lastAccessedAt: iso(-4 * 60 * 60 * 1000),
        },
        {
          membershipId: "m-alpha-naod",
          user: naod,
          role: "MEMBER",
          roleLabel: "DATA SCIENTIST",
          joinedAt: iso(-30 * day),
          lastAccessedAt: iso(-2 * day),
        },
        {
          membershipId: "m-alpha-liya",
          user: liya,
          role: "MEMBER",
          roleLabel: "PRODUCT DESIGNER",
          joinedAt: iso(-20 * day),
          lastAccessedAt: iso(-90 * 60 * 1000),
        },
        {
          membershipId: "m-alpha-fitsum",
          user: fitsum,
          role: "ADMIN",
          roleLabel: "ENGINEERING LEAD",
          joinedAt: iso(-110 * day),
          lastAccessedAt: iso(-45 * 60 * 1000),
        },
        {
          membershipId: "m-alpha-sara",
          user: sara,
          role: "VIEWER",
          roleLabel: "FINANCE",
          joinedAt: iso(-7 * day),
          lastAccessedAt: iso(-5 * day),
        },
        {
          membershipId: "m-alpha-robel",
          user: robel,
          role: "MEMBER",
          roleLabel: "DEVOPS",
          joinedAt: iso(-12 * day),
          lastAccessedAt: iso(-6 * 60 * 60 * 1000),
        },
      ],
      invitations: [
        {
          id: "inv-alpha-1",
          email: "selam.kebede@example.com",
          role: "MEMBER",
          roleLabel: "DEVELOPER",
          invitedBy: { id: jane.id, fullName: jane.fullName },
          createdAt: iso(-2 * day),
          expiresAt: iso(5 * day),
          status: "pending",
        },
        {
          id: "inv-alpha-2",
          email: "stale.viewer@example.com",
          role: "VIEWER",
          roleLabel: "VIEWER",
          invitedBy: { id: sam.id, fullName: sam.fullName },
          createdAt: iso(-10 * day),
          expiresAt: iso(-1 * day),
          status: "expired",
        },
        {
          id: "inv-alpha-3",
          email: "abel.solomon@example.com",
          role: "MANAGER",
          roleLabel: "PROJECT MANAGER",
          invitedBy: { id: jane.id, fullName: jane.fullName },
          createdAt: iso(-12 * 60 * 60 * 1000),
          expiresAt: iso(6 * day),
          status: "pending",
        },
        {
          id: "inv-alpha-4",
          email: "henok.zewdu@example.com",
          role: "MEMBER",
          roleLabel: "DEVELOPER",
          invitedBy: { id: sam.id, fullName: sam.fullName },
          createdAt: iso(-4 * day),
          expiresAt: iso(3 * day),
          status: "pending",
        },
        {
          id: "inv-alpha-5",
          email: "tigist.alem@example.com",
          role: "VIEWER",
          roleLabel: "STAKEHOLDER",
          invitedBy: { id: jane.id, fullName: jane.fullName },
          createdAt: iso(-1 * day),
          expiresAt: iso(6 * day),
          status: "pending",
        },
      ],
    },
    thesis: {
      type: "academic",
      archived: false,
      members: [
        {
          membershipId: "m-thesis-prof",
          user: {
            id: "user-prof",
            fullName: "Dr. Selamawit Asefa",
            email: "helena@university.edu",
            avatarUrl: null,
          },
          role: "OWNER",
          roleLabel: "OWNER",
          joinedAt: iso(-300 * day),
          lastAccessedAt: iso(-2 * day),
        },
        {
          membershipId: "m-thesis-jane",
          user: jane,
          role: "MEMBER",
          roleLabel: "STUDENT",
          joinedAt: iso(-180 * day),
          lastAccessedAt: iso(-2 * 60 * 60 * 1000),
        },
        {
          membershipId: "m-thesis-alex",
          user: alex,
          role: "MEMBER",
          roleLabel: "STUDENT",
          joinedAt: iso(-150 * day),
          lastAccessedAt: iso(-day),
        },
      ],
      invitations: [],
    },
    personal: {
      type: "general",
      archived: false,
      members: [
        {
          membershipId: "m-personal-jane",
          user: jane,
          role: "OWNER",
          roleLabel: "OWNER",
          joinedAt: iso(-200 * day),
          lastAccessedAt: iso(-60_000),
        },
      ],
      invitations: [],
    },
    research: {
      type: "academic",
      archived: true,
      members: [
        {
          membershipId: "m-research-jane",
          user: jane,
          role: "MEMBER",
          roleLabel: "REVIEWER",
          joinedAt: iso(-50 * day),
          lastAccessedAt: iso(-30 * day),
        },
        {
          membershipId: "m-research-mira",
          user: mira,
          role: "OWNER",
          roleLabel: "OWNER",
          joinedAt: iso(-220 * day),
          lastAccessedAt: iso(-30 * day),
        },
      ],
      invitations: [],
    },
  };
}

const STORE: Record<string, WorkspaceData> = seed();

function getOrInit(workspaceId: string): WorkspaceData {
  if (!STORE[workspaceId]) {
    STORE[workspaceId] = {
      type: "general",
      archived: false,
      members: [
        {
          membershipId: `m-${workspaceId}-self`,
          user: {
            id: "user-jane",
            fullName: "Elshaday Tesfaye",
            email: "jane@collabsphere.app",
            avatarUrl: null,
          },
          role: "OWNER",
          roleLabel: "OWNER",
          joinedAt: iso(-day),
          lastAccessedAt: iso(0),
        },
      ],
      invitations: [],
    };
  }
  return STORE[workspaceId];
}

const wait = (ms = 240) => new Promise((res) => setTimeout(res, ms));

function makeError(code: string, message: string): ApiError {
  const err = new Error(message) as ApiError;
  err.code = code;
  err.requestId = `req_${Math.random().toString(36).slice(2, 10)}`;
  return err;
}

export async function fetchMembers(workspaceId: string): Promise<{
  data: { items: WorkspaceMember[] };
}> {
  await wait();
  const data = getOrInit(workspaceId);
  return { data: { items: [...data.members] } };
}

export async function fetchPendingInvitations(workspaceId: string): Promise<{
  data: { items: PendingInvitation[] };
}> {
  await wait();
  const data = getOrInit(workspaceId);
  // Mark as expired on read so the UI sees consistent state.
  const items = data.invitations.map((inv) =>
    new Date(inv.expiresAt) < new Date() ? { ...inv, status: "expired" as const } : inv,
  );
  return { data: { items } };
}

export async function changeMemberRole(
  workspaceId: string,
  membershipId: string,
  role: WorkspaceRole,
): Promise<void> {
  await wait();
  const data = getOrInit(workspaceId);
  const member = data.members.find((m) => m.membershipId === membershipId);
  if (!member) throw makeError("NOT_FOUND", "Member not found.");
  if (member.role === "OWNER") throw makeError("CANNOT_DEMOTE_OWNER", "Cannot demote the Owner.");
  if (role === "OWNER") throw makeError("FORBIDDEN_ROLE_ASSIGNMENT", "Cannot assign Owner role.");
  member.role = role;
  member.roleLabel = getWorkspaceRoleLabel(data.type, role);
}

export async function removeMember(
  workspaceId: string,
  membershipId: string,
): Promise<void> {
  await wait();
  const data = getOrInit(workspaceId);
  const member = data.members.find((m) => m.membershipId === membershipId);
  if (!member) throw makeError("NOT_FOUND", "Member not found.");
  if (member.role === "OWNER") {
    throw makeError("CANNOT_REMOVE_OWNER", "Cannot remove the workspace Owner.");
  }
  data.members = data.members.filter((m) => m.membershipId !== membershipId);
}

export async function inviteMember(
  workspaceId: string,
  params: { email: string; role: WorkspaceRole },
): Promise<void> {
  await wait();
  const data = getOrInit(workspaceId);
  if (data.archived) {
    throw makeError(
      "WORKSPACE_ARCHIVED",
      "This workspace is archived. Restore it to invite new members.",
    );
  }
  const email = params.email.trim().toLowerCase();
  if (data.members.some((m) => m.user.email.toLowerCase() === email)) {
    throw makeError("EMAIL_ALREADY_MEMBER", "Already a member.");
  }
  const existing = data.invitations.find((i) => i.email.toLowerCase() === email);
  if (existing && new Date(existing.expiresAt) > new Date()) {
    // Treat as a resend if rate-limit allows (1 resend per 24h).
    if (existing.lastResentAt && Date.now() - new Date(existing.lastResentAt).getTime() < day) {
      throw makeError(
        "INVITATION_RESEND_RATE_LIMITED",
        "Invitation was resent recently. Try again in 24 hours.",
      );
    }
    existing.lastResentAt = iso(0);
    existing.expiresAt = iso(7 * day);
    return;
  }
  if (data.members.length + data.invitations.length >= 50) {
    throw makeError("WORKSPACE_MEMBER_LIMIT_REACHED", "Workspace member limit reached.");
  }
  // Replace any expired invite to the same email.
  data.invitations = data.invitations.filter((i) => i.email.toLowerCase() !== email);
  data.invitations.push({
    id: `inv-${workspaceId}-${Date.now()}`,
    email,
    role: params.role,
    roleLabel: getWorkspaceRoleLabel(data.type, params.role),
    invitedBy: { id: "user-jane", fullName: "Elshaday Tesfaye" },
    createdAt: iso(0),
    expiresAt: iso(7 * day),
    status: "pending",
    lastResentAt: null,
  });
}

export async function revokeInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  await wait();
  const data = getOrInit(workspaceId);
  data.invitations = data.invitations.filter((i) => i.id !== invitationId);
}
