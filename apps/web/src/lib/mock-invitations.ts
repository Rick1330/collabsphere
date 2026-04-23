// Mock invitations indexed by token. The /invite/:token surface uses these
// to demo every state without a backend.

export type InvitationStatus =
  | "pending"
  | "expired"
  | "used"
  | "invalid"
  | "email_mismatch";

export interface Invitation {
  token: string;
  status: InvitationStatus;
  workspace: {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: "professional" | "academic" | "general";
    memberCount: number;
  };
  invitedBy: { fullName: string; email: string };
  email: string;          // address the invite was sent to
  role: "viewer" | "member" | "manager" | "supervisor";
  expiresAt: string;      // ISO
  createdAt: string;      // ISO
}

const now = Date.now();
const iso = (msFromNow: number) => new Date(now + msFromNow).toISOString();

export const MOCK_INVITATIONS: Record<string, Invitation> = {
  "demo-pending": {
    token: "demo-pending",
    status: "pending",
    workspace: {
      id: "alpha",
      name: "Project Alpha",
      description: "Building the next-gen collaboration platform.",
      icon: "📦",
      type: "professional",
      memberCount: 6,
    },
    invitedBy: { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" },
    email: "you@example.com",
    role: "member",
    createdAt: iso(-2 * 24 * 60 * 60 * 1000),
    expiresAt: iso(5 * 24 * 60 * 60 * 1000),
  },
  "demo-expired": {
    token: "demo-expired",
    status: "expired",
    workspace: {
      id: "thesis",
      name: "Thesis — Distributed Systems",
      description: "Final year research workspace.",
      icon: "🎓",
      type: "academic",
      memberCount: 4,
    },
    invitedBy: { fullName: "Prof. Anwar Mohammed", email: "anwar@uni.edu" },
    email: "student@uni.edu",
    role: "supervisor",
    createdAt: iso(-30 * 24 * 60 * 60 * 1000),
    expiresAt: iso(-2 * 24 * 60 * 60 * 1000),
  },
  "demo-used": {
    token: "demo-used",
    status: "used",
    workspace: {
      id: "research",
      name: "Research Group",
      description: "ML paper collaboration workspace.",
      icon: "🔬",
      type: "academic",
      memberCount: 5,
    },
    invitedBy: { fullName: "Kidist Alemu", email: "alice@lab.io" },
    email: "you@example.com",
    role: "member",
    createdAt: iso(-7 * 24 * 60 * 60 * 1000),
    expiresAt: iso(7 * 24 * 60 * 60 * 1000),
  },
  "demo-mismatch": {
    token: "demo-mismatch",
    status: "email_mismatch",
    workspace: {
      id: "alpha",
      name: "Project Alpha",
      description: "Building the next-gen collaboration platform.",
      icon: "📦",
      type: "professional",
      memberCount: 6,
    },
    invitedBy: { fullName: "Eyob Bekele", email: "bob@collabsphere.app" },
    email: "different.address@work.com",
    role: "manager",
    createdAt: iso(-1 * 24 * 60 * 60 * 1000),
    expiresAt: iso(6 * 24 * 60 * 60 * 1000),
  },
};

export function lookupInvitation(token: string): Invitation | null {
  if (MOCK_INVITATIONS[token]) return MOCK_INVITATIONS[token];
  // Anything else: treat as a real-looking token and synthesize a pending
  // invite so the live demo feels real. If you want to test the invalid
  // state, use /invite/invalid.
  if (token === "invalid") return null;
  return {
    token,
    status: "pending",
    workspace: {
      id: "alpha",
      name: "Project Alpha",
      description: "Building the next-gen collaboration platform.",
      icon: "📦",
      type: "professional",
      memberCount: 6,
    },
    invitedBy: { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" },
    email: "you@example.com",
    role: "member",
    createdAt: iso(-1 * 60 * 60 * 1000),
    expiresAt: iso(6 * 24 * 60 * 60 * 1000),
  };
}
