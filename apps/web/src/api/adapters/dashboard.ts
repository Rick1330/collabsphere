/**
 * Dashboard API adapter.
 *
 * The dashboard surfaces cross-cutting summary data (workspaces, my tasks,
 * recent activity). Today these come from local fixtures inside the
 * dashboard slice; this adapter is the canonical async seam, and lets the
 * dashboard widgets stay free of direct fixture imports.
 */

export type DashboardWorkspaceSummary = {
  id: string;
  name: string;
  description: string;
  type: "professional" | "academic" | "general";
  icon?: string;
  docs: number;
  tasks: number;
  memberCount: number;
  recentMembers: { id: string; fullName: string }[];
  roleLabel: string;
  lastAccessedAt: string;
};

export type DashboardTask = {
  id: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "todo" | "in_progress" | "in_review";
  dueDate?: string;
};

export type DashboardActivityEvent = {
  id: string;
  actor: { id: string; fullName: string };
  action: "created" | "updated" | "commented" | "completed" | "shared";
  resource?: { type: "doc" | "task"; title: string };
  workspaceName: string;
  createdAt: string;
};

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString();
const min = (offset: number) => new Date(Date.now() - offset * 60_000).toISOString();
const hr = (offset: number) => new Date(Date.now() - offset * 3600_000).toISOString();

const MOCK_WORKSPACES: DashboardWorkspaceSummary[] = [
  {
    id: "alpha",
    name: "Project Alpha",
    description: "Q4 product launch & GTM coordination",
    type: "professional",
    docs: 24,
    tasks: 12,
    memberCount: 8,
    recentMembers: [
      { id: "1", fullName: "Elshaday Tesfaye" },
      { id: "2", fullName: "Marco Silva" },
      { id: "3", fullName: "Aiko Tanaka" },
      { id: "4", fullName: "Priya Reddy" },
    ],
    roleLabel: "OWNER",
    lastAccessedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: "thesis",
    name: "Thesis — Distributed Systems",
    description: "Consensus algorithms research notes",
    type: "academic",
    docs: 41,
    tasks: 5,
    memberCount: 3,
    recentMembers: [
      { id: "5", fullName: "Elshaday Tesfaye" },
      { id: "6", fullName: "Prof. Hadid" },
      { id: "7", fullName: "Lukas Berger" },
    ],
    roleLabel: "EDITOR",
    lastAccessedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    id: "design-ops",
    name: "Design Ops",
    description: "Component library & design tokens",
    type: "professional",
    docs: 18,
    tasks: 9,
    memberCount: 6,
    recentMembers: [
      { id: "8", fullName: "Sasha Lee" },
      { id: "9", fullName: "Diego Martín" },
      { id: "10", fullName: "Nora Khan" },
    ],
    roleLabel: "EDITOR",
    lastAccessedAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
  },
  {
    id: "personal",
    name: "Personal Notes",
    description: "Reading list, ideas, journal",
    type: "general",
    docs: 7,
    tasks: 2,
    memberCount: 1,
    recentMembers: [{ id: "11", fullName: "Elshaday Tesfaye" }],
    roleLabel: "OWNER",
    lastAccessedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
  },
];

const MOCK_TASKS: DashboardTask[] = [
  { id: "t1", title: "Finalize Q4 launch deck", workspaceId: "alpha", workspaceName: "Project Alpha", priority: "urgent", status: "in_progress", dueDate: day(-1) },
  { id: "t2", title: "Review consensus chapter draft", workspaceId: "thesis", workspaceName: "Thesis", priority: "high", status: "in_review", dueDate: day(0) },
  { id: "t3", title: "Update onboarding flow tokens", workspaceId: "design-ops", workspaceName: "Design Ops", priority: "medium", status: "todo", dueDate: day(2) },
  { id: "t4", title: "Sync with marketing on copy", workspaceId: "alpha", workspaceName: "Project Alpha", priority: "medium", status: "in_progress", dueDate: day(3) },
  { id: "t5", title: "Reorganise reading list", workspaceId: "personal", workspaceName: "Personal Notes", priority: "low", status: "todo" },
];

const MOCK_EVENTS: DashboardActivityEvent[] = [
  { id: "e1", actor: { id: "u2", fullName: "Marco Silva" }, action: "commented", resource: { type: "doc", title: "Q4 Roadmap" }, workspaceName: "Project Alpha", createdAt: min(8) },
  { id: "e2", actor: { id: "u3", fullName: "Aiko Tanaka" }, action: "completed", resource: { type: "task", title: "Wire up auth callbacks" }, workspaceName: "Project Alpha", createdAt: min(42) },
  { id: "e3", actor: { id: "u4", fullName: "Priya Reddy" }, action: "created", resource: { type: "doc", title: "Launch checklist" }, workspaceName: "Project Alpha", createdAt: hr(2) },
  { id: "e4", actor: { id: "u5", fullName: "Prof. Hadid" }, action: "updated", resource: { type: "doc", title: "Chapter 3 draft" }, workspaceName: "Thesis", createdAt: hr(5) },
  { id: "e5", actor: { id: "u6", fullName: "Sasha Lee" }, action: "shared", resource: { type: "doc", title: "Token spec v2" }, workspaceName: "Design Ops", createdAt: hr(9) },
];

export async function getDashboardWorkspaces(): Promise<DashboardWorkspaceSummary[]> {
  // TODO(api): GET /me/dashboard/workspaces
  return MOCK_WORKSPACES;
}

export async function getDashboardTasks(): Promise<DashboardTask[]> {
  // TODO(api): GET /me/dashboard/tasks
  return MOCK_TASKS;
}

export async function getDashboardActivity(): Promise<DashboardActivityEvent[]> {
  // TODO(api): GET /me/dashboard/activity
  return MOCK_EVENTS;
}
