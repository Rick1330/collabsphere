// Mock admin API. Powers /admin, /admin/users, /admin/users/:id,
// /admin/workspaces, /admin/audit. Uses the same shape (data + meta)
// the rest of the app already consumes.

export type GlobalRole = "USER" | "ADMIN";
export type AuthProvider = "local" | "google";
export type AdminWorkspaceType = "professional" | "academic" | "general";
export type AdminWorkspaceStatus = "active" | "archived";
export type AuditSeverity = "info" | "warn" | "error";

export interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  activeUsersLast7Days: number;
  storageUsedBytes: number;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  globalRole: GlobalRole;
  isActive: boolean;
  authProvider: AuthProvider;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserDetail extends AdminUser {
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  workspaces: Array<{
    id: string;
    name: string;
    type: AdminWorkspaceType;
    role: string;
    roleLabel: string;
  }>;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  type: AdminWorkspaceType;
  status: AdminWorkspaceStatus;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  documentCount: number;
  taskCount: number;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  severity: AuditSeverity;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  ipAddress: string;
  details: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiError extends Error {
  code?: string;
}

const day = 24 * 60 * 60 * 1000;
const iso = (msOffset: number) => new Date(Date.now() + msOffset).toISOString();
const wait = (ms = 280) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const USERS: AdminUser[] = [
  {
    id: "u_jane",
    fullName: "Elshaday Tesfaye",
    email: "jane@collabsphere.app",
    globalRole: "ADMIN",
    isActive: true,
    authProvider: "local",
    createdAt: iso(-220 * day),
    lastLoginAt: iso(-30 * 60 * 1000),
  },
  {
    id: "u_sam",
    fullName: "Samuel Haile",
    email: "sam@collabsphere.app",
    globalRole: "USER",
    isActive: true,
    authProvider: "google",
    createdAt: iso(-180 * day),
    lastLoginAt: iso(-3 * 60 * 60 * 1000),
  },
  {
    id: "u_bob",
    fullName: "Eyob Bekele",
    email: "bob@collabsphere.app",
    globalRole: "USER",
    isActive: true,
    authProvider: "local",
    createdAt: iso(-150 * day),
    lastLoginAt: iso(-day),
  },
  {
    id: "u_alice",
    fullName: "Kidist Alemu",
    email: "alice@collabsphere.app",
    globalRole: "USER",
    isActive: true,
    authProvider: "google",
    createdAt: iso(-110 * day),
    lastLoginAt: iso(-2 * 60 * 60 * 1000),
  },
  {
    id: "u_mira",
    fullName: "Hiwot Mengistu",
    email: "mira@collabsphere.app",
    globalRole: "USER",
    isActive: true,
    authProvider: "local",
    createdAt: iso(-95 * day),
    lastLoginAt: iso(-5 * 60 * 60 * 1000),
  },
  {
    id: "u_alex",
    fullName: "Yonas Girma",
    email: "alex@collabsphere.app",
    globalRole: "USER",
    isActive: true,
    authProvider: "google",
    createdAt: iso(-80 * day),
    lastLoginAt: iso(-2 * day),
  },
  {
    id: "u_priya",
    fullName: "Bethel Tekle",
    email: "priya@collabsphere.app",
    globalRole: "ADMIN",
    isActive: true,
    authProvider: "local",
    createdAt: iso(-65 * day),
    lastLoginAt: iso(-6 * 60 * 60 * 1000),
  },
  {
    id: "u_tom",
    fullName: "Tewodros Worku",
    email: "tom@collabsphere.app",
    globalRole: "USER",
    isActive: false,
    authProvider: "local",
    createdAt: iso(-50 * day),
    lastLoginAt: iso(-25 * day),
  },
  {
    id: "u_helena",
    fullName: "Dr. Selamawit Asefa",
    email: "helena@university.edu",
    globalRole: "USER",
    isActive: true,
    authProvider: "google",
    createdAt: iso(-300 * day),
    lastLoginAt: iso(-2 * day),
  },
  {
    id: "u_neil",
    fullName: "Nahom Fikru",
    email: "neil@example.com",
    globalRole: "USER",
    isActive: true,
    authProvider: "google",
    createdAt: iso(-30 * day),
    lastLoginAt: null,
  },
  {
    id: "u_ola",
    fullName: "Olana Negash",
    email: "ola@example.com",
    globalRole: "USER",
    isActive: false,
    authProvider: "local",
    createdAt: iso(-20 * day),
    lastLoginAt: iso(-12 * day),
  },
  {
    id: "u_rin",
    fullName: "Rahel Tadele",
    email: "rin@example.com",
    globalRole: "USER",
    isActive: true,
    authProvider: "google",
    createdAt: iso(-12 * day),
    lastLoginAt: iso(-4 * 60 * 60 * 1000),
  },
  {
    id: "u_dev",
    fullName: "Dawit Mulu",
    email: "dev@example.com",
    globalRole: "USER",
    isActive: true,
    authProvider: "local",
    createdAt: iso(-8 * day),
    lastLoginAt: iso(-90 * 60 * 1000),
  },
  {
    id: "u_lila",
    fullName: "Liya Yohannes",
    email: "lila@example.com",
    globalRole: "USER",
    isActive: true,
    authProvider: "google",
    createdAt: iso(-5 * day),
    lastLoginAt: iso(-4 * day),
  },
  {
    id: "u_marco",
    fullName: "Markos Beyene",
    email: "marco@example.com",
    globalRole: "USER",
    isActive: true,
    authProvider: "local",
    createdAt: iso(-3 * day),
    lastLoginAt: iso(-day),
  },
  {
    id: "u_yael",
    fullName: "Yared Shimelis",
    email: "yael@example.com",
    globalRole: "USER",
    isActive: true,
    authProvider: "google",
    createdAt: iso(-2 * day),
    lastLoginAt: iso(-3 * 60 * 60 * 1000),
  },
];

const USER_DETAIL_EXTRAS: Record<
  string,
  Pick<AdminUserDetail, "bio" | "avatarUrl" | "isVerified" | "workspaces">
> = {
  u_jane: {
    bio: "Full-stack developer passionate about collaboration tools.",
    avatarUrl: null,
    isVerified: true,
    workspaces: [
      { id: "alpha", name: "Project Alpha", type: "professional", role: "OWNER", roleLabel: "OWNER" },
      { id: "thesis", name: "Thesis — Distributed Systems", type: "academic", role: "MEMBER", roleLabel: "STUDENT" },
      { id: "personal", name: "Personal Notes", type: "general", role: "OWNER", roleLabel: "OWNER" },
    ],
  },
  u_sam: {
    bio: "Tech lead. Loves clean APIs and good documentation.",
    avatarUrl: null,
    isVerified: true,
    workspaces: [
      { id: "alpha", name: "Project Alpha", type: "professional", role: "ADMIN", roleLabel: "TECH LEAD" },
    ],
  },
  u_bob: {
    bio: null,
    avatarUrl: null,
    isVerified: true,
    workspaces: [
      { id: "alpha", name: "Project Alpha", type: "professional", role: "MANAGER", roleLabel: "PROJECT MANAGER" },
    ],
  },
  u_alice: {
    bio: "Frontend engineer.",
    avatarUrl: null,
    isVerified: true,
    workspaces: [
      { id: "alpha", name: "Project Alpha", type: "professional", role: "MEMBER", roleLabel: "DEVELOPER" },
    ],
  },
  u_mira: {
    bio: null,
    avatarUrl: null,
    isVerified: true,
    workspaces: [
      { id: "alpha", name: "Project Alpha", type: "professional", role: "MEMBER", roleLabel: "DEVELOPER" },
      { id: "research", name: "Research Group", type: "academic", role: "OWNER", roleLabel: "OWNER" },
    ],
  },
  u_alex: {
    bio: "Designer / illustrator.",
    avatarUrl: null,
    isVerified: true,
    workspaces: [
      { id: "alpha", name: "Project Alpha", type: "professional", role: "MEMBER", roleLabel: "DESIGNER" },
      { id: "thesis", name: "Thesis — Distributed Systems", type: "academic", role: "MEMBER", roleLabel: "STUDENT" },
    ],
  },
  u_priya: {
    bio: "Platform admin and stakeholder.",
    avatarUrl: null,
    isVerified: true,
    workspaces: [
      { id: "alpha", name: "Project Alpha", type: "professional", role: "VIEWER", roleLabel: "STAKEHOLDER" },
    ],
  },
  u_tom: {
    bio: null,
    avatarUrl: null,
    isVerified: false,
    workspaces: [
      { id: "alpha", name: "Project Alpha", type: "professional", role: "VIEWER", roleLabel: "STAKEHOLDER" },
    ],
  },
  u_helena: {
    bio: "Professor of Distributed Systems.",
    avatarUrl: null,
    isVerified: true,
    workspaces: [
      { id: "thesis", name: "Thesis — Distributed Systems", type: "academic", role: "OWNER", roleLabel: "OWNER" },
    ],
  },
};

let WORKSPACES: AdminWorkspace[] = [
  {
    id: "alpha",
    name: "Project Alpha",
    type: "professional",
    status: "active",
    ownerName: "Elshaday Tesfaye",
    ownerEmail: "jane@collabsphere.app",
    memberCount: 8,
    documentCount: 42,
    taskCount: 137,
    createdAt: iso(-120 * day),
  },
  {
    id: "thesis",
    name: "Thesis — Distributed Systems",
    type: "academic",
    status: "active",
    ownerName: "Dr. Selamawit Asefa",
    ownerEmail: "helena@university.edu",
    memberCount: 3,
    documentCount: 18,
    taskCount: 24,
    createdAt: iso(-300 * day),
  },
  {
    id: "personal",
    name: "Personal Notes",
    type: "general",
    status: "active",
    ownerName: "Elshaday Tesfaye",
    ownerEmail: "jane@collabsphere.app",
    memberCount: 1,
    documentCount: 12,
    taskCount: 6,
    createdAt: iso(-200 * day),
  },
  {
    id: "research",
    name: "Research Group",
    type: "academic",
    status: "archived",
    ownerName: "Hiwot Mengistu",
    ownerEmail: "mira@collabsphere.app",
    memberCount: 2,
    documentCount: 7,
    taskCount: 0,
    createdAt: iso(-220 * day),
  },
  {
    id: "marketing",
    name: "Marketing Q1",
    type: "professional",
    status: "active",
    ownerName: "Samuel Haile",
    ownerEmail: "sam@collabsphere.app",
    memberCount: 5,
    documentCount: 23,
    taskCount: 41,
    createdAt: iso(-60 * day),
  },
  {
    id: "design-system",
    name: "Design System",
    type: "professional",
    status: "active",
    ownerName: "Yonas Girma",
    ownerEmail: "alex@collabsphere.app",
    memberCount: 4,
    documentCount: 31,
    taskCount: 18,
    createdAt: iso(-90 * day),
  },
  {
    id: "rfc-archive",
    name: "RFC Archive",
    type: "general",
    status: "archived",
    ownerName: "Eyob Bekele",
    ownerEmail: "bob@collabsphere.app",
    memberCount: 1,
    documentCount: 60,
    taskCount: 0,
    createdAt: iso(-400 * day),
  },
];

// Audit log seed — generated to give a realistic feed
const AUDIT_TEMPLATES: Array<Omit<AuditEvent, "id" | "createdAt">> = [
  {
    eventType: "auth.login",
    severity: "info",
    actorId: "u_jane",
    actorName: "Elshaday Tesfaye",
    actorEmail: "jane@collabsphere.app",
    ipAddress: "203.0.113.14",
    details: "User signed in via password.",
    metadata: { provider: "local", userAgent: "Mozilla/5.0 Chrome/121.0", sessionId: "sess_8f2a" },
  },
  {
    eventType: "auth.login_failed",
    severity: "warn",
    actorId: null,
    actorName: null,
    actorEmail: "tom@collabsphere.app",
    ipAddress: "198.51.100.42",
    details: "Failed login: invalid credentials.",
    metadata: { reason: "invalid_password", attemptCount: 1, rateLimitRemaining: 4 },
  },
  {
    eventType: "auth.login_failed",
    severity: "error",
    actorId: null,
    actorName: null,
    actorEmail: "unknown@example.com",
    ipAddress: "198.51.100.77",
    details: "Repeated failed login attempts (5+) — IP temporarily blocked for 15 minutes.",
    metadata: { reason: "rate_limited", attemptCount: 6, blockDurationSeconds: 900 },
  },
  {
    eventType: "auth.logout",
    severity: "info",
    actorId: "u_sam",
    actorName: "Samuel Haile",
    actorEmail: "sam@collabsphere.app",
    ipAddress: "203.0.113.21",
    details: "User signed out.",
    metadata: { sessionDurationMinutes: 142 },
  },
  {
    eventType: "auth.register",
    severity: "info",
    actorId: "u_yael",
    actorName: "Yared Shimelis",
    actorEmail: "yael@example.com",
    ipAddress: "192.0.2.55",
    details: "New account registered via Google OAuth.",
    metadata: { provider: "google", referrer: "/login" },
  },
  {
    eventType: "auth.password_changed",
    severity: "info",
    actorId: "u_bob",
    actorName: "Eyob Bekele",
    actorEmail: "bob@collabsphere.app",
    ipAddress: "203.0.113.5",
    details: "Password changed successfully.",
    metadata: { initiatedBy: "self" },
  },
  {
    eventType: "auth.password_reset",
    severity: "warn",
    actorId: "u_alice",
    actorName: "Kidist Alemu",
    actorEmail: "alice@collabsphere.app",
    ipAddress: "192.0.2.101",
    details: "Password reset link requested.",
    metadata: { tokenTtlHours: 1, deliveryEmail: "alice@collabsphere.app" },
  },
  {
    eventType: "user.deactivated",
    severity: "warn",
    actorId: "u_jane",
    actorName: "Elshaday Tesfaye",
    actorEmail: "jane@collabsphere.app",
    ipAddress: "203.0.113.14",
    details: "Deactivated user u_tom (Tewodros Worku).",
    metadata: { targetUserId: "u_tom", targetEmail: "tom@collabsphere.app", reason: "policy_violation" },
  },
  {
    eventType: "user.role_changed",
    severity: "error",
    actorId: "u_jane",
    actorName: "Elshaday Tesfaye",
    actorEmail: "jane@collabsphere.app",
    ipAddress: "203.0.113.14",
    details: "Promoted u_priya (Bethel Tekle) to ADMIN.",
    metadata: { targetUserId: "u_priya", fromRole: "USER", toRole: "ADMIN" },
  },
  {
    eventType: "workspace.archived",
    severity: "warn",
    actorId: "u_mira",
    actorName: "Hiwot Mengistu",
    actorEmail: "mira@collabsphere.app",
    ipAddress: "203.0.113.66",
    details: "Archived workspace 'Research Group' (id: research).",
    metadata: { workspaceId: "research", workspaceName: "Research Group", memberCount: 2 },
  },
  {
    eventType: "workspace.deleted",
    severity: "error",
    actorId: "u_jane",
    actorName: "Elshaday Tesfaye",
    actorEmail: "jane@collabsphere.app",
    ipAddress: "203.0.113.14",
    details: "Force-deleted workspace 'Old Sandbox' (id: sandbox-2023). 14 documents purged.",
    metadata: { workspaceId: "sandbox-2023", documentsPurged: 14, tasksPurged: 31, force: true },
  },
  {
    eventType: "member.removed",
    severity: "info",
    actorId: "u_sam",
    actorName: "Samuel Haile",
    actorEmail: "sam@collabsphere.app",
    ipAddress: "203.0.113.21",
    details: "Removed user_alice from workspace 'Marketing Q1'.",
    metadata: { workspaceId: "marketing", removedUserId: "u_alice", removedRole: "MEMBER" },
  },
  {
    eventType: "document.exported",
    severity: "info",
    actorId: "u_bob",
    actorName: "Eyob Bekele",
    actorEmail: "bob@collabsphere.app",
    ipAddress: "203.0.113.5",
    details: "Exported document 'Q1 Roadmap' as PDF.",
    metadata: { documentId: "doc_q1roadmap", format: "pdf", sizeBytes: 482133 },
  },
  {
    eventType: "ownership.transferred",
    severity: "error",
    actorId: "u_jane",
    actorName: "Elshaday Tesfaye",
    actorEmail: "jane@collabsphere.app",
    ipAddress: "203.0.113.14",
    details: "Transferred ownership of 'Design System' to u_alex (Yonas Girma).",
    metadata: { workspaceId: "design-system", fromUserId: "u_jane", toUserId: "u_alex" },
  },
  {
    eventType: "user.reactivated",
    severity: "info",
    actorId: "u_priya",
    actorName: "Bethel Tekle",
    actorEmail: "priya@collabsphere.app",
    ipAddress: "203.0.113.88",
    details: "Reactivated user u_ola (Olana Negash).",
    metadata: { targetUserId: "u_ola" },
  },
  {
    eventType: "system.health_check",
    severity: "info",
    actorId: null,
    actorName: null,
    actorEmail: null,
    ipAddress: "10.0.0.1",
    details: "Scheduled system health check completed.",
    metadata: { duration_ms: 312, services_checked: 8, services_healthy: 8 },
  },
];

const AUDIT: AuditEvent[] = [];
{
  // Build ~180 events spread over the past 60 days
  const COUNT = 180;
  for (let i = 0; i < COUNT; i++) {
    const t = AUDIT_TEMPLATES[i % AUDIT_TEMPLATES.length];
    const offsetMinutes =
      // Heavier in last 7 days, lighter further back.
      i < 60 ? -i * 90 : -(60 * 90 + (i - 60) * 60 * 12);
    AUDIT.push({
      ...t,
      id: `evt_${i.toString().padStart(4, "0")}`,
      createdAt: new Date(Date.now() + offsetMinutes * 60 * 1000).toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function makeError(code: string, message: string): ApiError {
  const err = new Error(message) as ApiError;
  err.code = code;
  return err;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  const meta: PaginationMeta = {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
  };
  return { items: slice, meta };
}

export async function fetchAdminStats(): Promise<{ data: AdminStats }> {
  await wait(220);
  const sevenDaysAgo = Date.now() - 7 * day;
  const activeUsersLast7Days = USERS.filter(
    (u) => u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= sevenDaysAgo,
  ).length;
  // Storage: ~32MB per document, mocked.
  const storageUsedBytes = WORKSPACES.reduce(
    (acc, w) => acc + w.documentCount * 32 * 1024 * 1024,
    0,
  );
  return {
    data: {
      totalUsers: USERS.length,
      totalWorkspaces: WORKSPACES.length,
      activeUsersLast7Days,
      storageUsedBytes,
    },
  };
}

export async function fetchAdminUsers(params: {
  search?: string;
  page: number;
  pageSize: number;
}): Promise<{ data: { items: AdminUser[] }; meta: { pagination: PaginationMeta } }> {
  await wait();
  const q = params.search?.trim().toLowerCase() ?? "";
  const filtered = q
    ? USERS.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      )
    : [...USERS];
  filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
  const { items, meta } = paginate(filtered, params.page, params.pageSize);
  return { data: { items }, meta: { pagination: meta } };
}

export async function fetchAdminUserDetail(
  userId: string,
): Promise<{ data: AdminUserDetail }> {
  await wait();
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw makeError("NOT_FOUND", "User not found.");
  const extras = USER_DETAIL_EXTRAS[userId] ?? {
    bio: null,
    avatarUrl: null,
    isVerified: true,
    workspaces: [],
  };
  return { data: { ...user, ...extras } };
}

export async function adminDeactivateUser(userId: string): Promise<void> {
  await wait();
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw makeError("NOT_FOUND", "User not found.");
  user.isActive = false;
}

export async function adminReactivateUser(userId: string): Promise<void> {
  await wait();
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw makeError("NOT_FOUND", "User not found.");
  user.isActive = true;
}

export async function adminPromoteUser(userId: string): Promise<void> {
  await wait();
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw makeError("NOT_FOUND", "User not found.");
  user.globalRole = "ADMIN";
}

export async function adminDemoteUser(userId: string): Promise<void> {
  await wait();
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw makeError("NOT_FOUND", "User not found.");
  user.globalRole = "USER";
}

export async function fetchAdminWorkspaces(params: {
  search?: string;
  page: number;
  pageSize: number;
}): Promise<{
  data: { items: AdminWorkspace[] };
  meta: { pagination: PaginationMeta };
}> {
  await wait();
  const q = params.search?.trim().toLowerCase() ?? "";
  const filtered = q
    ? WORKSPACES.filter((w) => w.name.toLowerCase().includes(q))
    : [...WORKSPACES];
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  const { items, meta } = paginate(filtered, params.page, params.pageSize);
  return { data: { items }, meta: { pagination: meta } };
}

export async function adminArchiveWorkspace(workspaceId: string): Promise<void> {
  await wait();
  const ws = WORKSPACES.find((w) => w.id === workspaceId);
  if (!ws) throw makeError("NOT_FOUND", "Workspace not found.");
  ws.status = "archived";
}

export async function adminUnarchiveWorkspace(
  workspaceId: string,
): Promise<void> {
  await wait();
  const ws = WORKSPACES.find((w) => w.id === workspaceId);
  if (!ws) throw makeError("NOT_FOUND", "Workspace not found.");
  ws.status = "active";
}

export async function adminForceDeleteWorkspace(
  workspaceId: string,
): Promise<void> {
  await wait(500);
  WORKSPACES = WORKSPACES.filter((w) => w.id !== workspaceId);
}

export async function fetchAuditLog(params: {
  eventType?: string;
  severity?: string;
  dateRange: string; // "24h" | "7d" | "30d" | "all"
  search?: string;
  page: number;
  pageSize: number;
}): Promise<{
  data: { items: AuditEvent[] };
  meta: { pagination: PaginationMeta };
}> {
  await wait();
  let filtered = [...AUDIT];

  if (params.eventType) {
    filtered = filtered.filter((e) => e.eventType === params.eventType);
  }
  if (params.severity) {
    filtered = filtered.filter((e) => e.severity === params.severity);
  }
  if (params.dateRange && params.dateRange !== "all") {
    const ranges: Record<string, number> = {
      "24h": day,
      "7d": 7 * day,
      "30d": 30 * day,
    };
    const span = ranges[params.dateRange];
    if (span) {
      const cutoff = Date.now() - span;
      filtered = filtered.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
    }
  }
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (e) =>
        (e.actorName ?? "").toLowerCase().includes(q) ||
        (e.actorEmail ?? "").toLowerCase().includes(q),
    );
  }

  filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const { items, meta } = paginate(filtered, params.page, params.pageSize);
  return { data: { items }, meta: { pagination: meta } };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Operational helpers — Wave 3 dashboard.
 * Real admin consoles surface trends and recent severe events, not
 * decorative "manage X" cards. These functions feed the new dashboard.
 * ──────────────────────────────────────────────────────────────────── */

export interface AdminOperationalStats extends AdminStats {
  newUsersLast7Days: number;
  newWorkspacesLast7Days: number;
  archivedWorkspaces: number;
  deactivatedUsers: number;
  adminCount: number;
  errorEventsLast24h: number;
  warnEventsLast24h: number;
  /** 7 daily counts of active users (oldest → newest). */
  activeUsersTrend: number[];
  /** 7 daily counts of new accounts (oldest → newest). */
  signupsTrend: number[];
  /** 7 daily counts of audit events (oldest → newest). */
  eventsTrend: number[];
  /** Quotas — for the storage progress widget. */
  storageQuotaBytes: number;
}

export async function fetchAdminOperationalStats(): Promise<{
  data: AdminOperationalStats;
}> {
  await wait(220);
  const sevenDaysAgo = Date.now() - 7 * day;
  const oneDayAgo = Date.now() - day;
  const activeUsersLast7Days = USERS.filter(
    (u) => u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= sevenDaysAgo,
  ).length;
  const newUsersLast7Days = USERS.filter(
    (u) => new Date(u.createdAt).getTime() >= sevenDaysAgo,
  ).length;
  const newWorkspacesLast7Days = WORKSPACES.filter(
    (w) => new Date(w.createdAt).getTime() >= sevenDaysAgo,
  ).length;
  const archivedWorkspaces = WORKSPACES.filter(
    (w) => w.status === "archived",
  ).length;
  const deactivatedUsers = USERS.filter((u) => !u.isActive).length;
  const adminCount = USERS.filter((u) => u.globalRole === "ADMIN").length;
  const errorEventsLast24h = AUDIT.filter(
    (e) =>
      e.severity === "error" && new Date(e.createdAt).getTime() >= oneDayAgo,
  ).length;
  const warnEventsLast24h = AUDIT.filter(
    (e) =>
      e.severity === "warn" && new Date(e.createdAt).getTime() >= oneDayAgo,
  ).length;

  // Build 7-day trend buckets (oldest → newest)
  const activeUsersTrend: number[] = [];
  const signupsTrend: number[] = [];
  const eventsTrend: number[] = [];
  for (let d = 6; d >= 0; d--) {
    const dayStart = Date.now() - (d + 1) * day;
    const dayEnd = Date.now() - d * day;
    activeUsersTrend.push(
      USERS.filter((u) => {
        if (!u.lastLoginAt) return false;
        const t = new Date(u.lastLoginAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length,
    );
    signupsTrend.push(
      USERS.filter((u) => {
        const t = new Date(u.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length,
    );
    eventsTrend.push(
      AUDIT.filter((e) => {
        const t = new Date(e.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length,
    );
  }

  const storageUsedBytes = WORKSPACES.reduce(
    (acc, w) => acc + w.documentCount * 32 * 1024 * 1024,
    0,
  );

  return {
    data: {
      totalUsers: USERS.length,
      totalWorkspaces: WORKSPACES.length,
      activeUsersLast7Days,
      storageUsedBytes,
      newUsersLast7Days,
      newWorkspacesLast7Days,
      archivedWorkspaces,
      deactivatedUsers,
      adminCount,
      errorEventsLast24h,
      warnEventsLast24h,
      activeUsersTrend,
      signupsTrend,
      eventsTrend,
      storageQuotaBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    },
  };
}

/** Most recent critical/warn audit events, for the dashboard feed. */
export async function fetchRecentCriticalEvents(
  limit = 8,
): Promise<{ data: { items: AuditEvent[] } }> {
  await wait(160);
  const items = [...AUDIT]
    .filter((e) => e.severity === "error" || e.severity === "warn")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
  return { data: { items } };
}

/** Top workspaces by member count — for the dashboard "watchlist". */
export async function fetchTopWorkspaces(
  limit = 5,
): Promise<{ data: { items: AdminWorkspace[] } }> {
  await wait(140);
  const items = [...WORKSPACES]
    .filter((w) => w.status === "active")
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, limit);
  return { data: { items } };
}

// Utility used by the dashboard.
export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
