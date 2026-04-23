// Mock notifications API — paginated feed of user notifications across workspaces.

export type NotificationType =
  | "task.assigned"
  | "task.completed"
  | "task.status_changed"
  | "document.mention"
  | "document.submitted"
  | "document.approved"
  | "comment.reply"
  | "workspace.member_joined"
  | "workspace.invitation"
  | "deadline.reminder";

export type NotificationCategory =
  | "tasks"
  | "documents"
  | "comments"
  | "workspace"
  | "deadlines";

export const NOTIFICATION_CATEGORY: Record<NotificationType, NotificationCategory> = {
  "task.assigned": "tasks",
  "task.completed": "tasks",
  "task.status_changed": "tasks",
  "document.mention": "documents",
  "document.submitted": "documents",
  "document.approved": "documents",
  "comment.reply": "comments",
  "workspace.member_joined": "workspace",
  "workspace.invitation": "workspace",
  "deadline.reminder": "deadlines",
};

export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  { label: string; tone: "teal" | "sky" | "stone" | "emerald" | "amber" }
> = {
  tasks: { label: "Tasks", tone: "teal" },
  documents: { label: "Documents", tone: "sky" },
  comments: { label: "Comments", tone: "stone" },
  workspace: { label: "Workspace", tone: "emerald" },
  deadlines: { label: "Deadlines", tone: "amber" },
};

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  workspaceId: string;
  workspaceName: string;
  url: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  data: { items: Notification[] };
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

const WORKSPACES = [
  { id: "alpha", name: "Project Alpha" },
  { id: "client", name: "Client Project" },
  { id: "thesis", name: "Thesis Research" },
];

const SEEDS: Array<Omit<Notification, "id" | "createdAt" | "isRead" | "readAt">> = [
  {
    type: "task.assigned",
    title: 'Jane assigned you to "Implement login page"',
    body: "Build the login UI and connect auth endpoints.",
    workspaceId: "alpha",
    workspaceName: "Project Alpha",
    url: "/w/alpha/tasks",
  },
  {
    type: "deadline.reminder",
    title: 'Task "Implement login" is due tomorrow',
    body: "Don't forget to complete this before the deadline.",
    workspaceId: "alpha",
    workspaceName: "Project Alpha",
    url: "/w/alpha/tasks",
  },
  {
    type: "comment.reply",
    title: 'Bob replied to your comment on "API Design"',
    body: '"Good point, let me update the endpoint contract for that case."',
    workspaceId: "client",
    workspaceName: "Client Project",
    url: "/w/client/documents",
  },
  {
    type: "task.completed",
    title: 'Bob completed task "Fix login bug"',
    body: null,
    workspaceId: "alpha",
    workspaceName: "Project Alpha",
    url: "/w/alpha/tasks",
  },
  {
    type: "workspace.member_joined",
    title: "Mike joined Project Alpha as Developer",
    body: null,
    workspaceId: "alpha",
    workspaceName: "Project Alpha",
    url: "/w/alpha/members",
  },
  {
    type: "document.mention",
    title: 'Alice mentioned you in "Project Roadmap Q4"',
    body: '"...@Jane please review the timeline section before Monday standup..."',
    workspaceId: "client",
    workspaceName: "Client Project",
    url: "/w/client/documents",
  },
  {
    type: "task.status_changed",
    title: 'Status changed to In Review on "Auth refactor"',
    body: "Sarah moved this task forward.",
    workspaceId: "alpha",
    workspaceName: "Project Alpha",
    url: "/w/alpha/tasks",
  },
  {
    type: "document.submitted",
    title: 'Jane submitted "Thesis Draft v3" for review',
    body: "Awaiting your feedback by end of week.",
    workspaceId: "thesis",
    workspaceName: "Thesis Research",
    url: "/w/thesis/documents",
  },
  {
    type: "document.approved",
    title: '"Thesis Draft v2" has been approved',
    body: null,
    workspaceId: "thesis",
    workspaceName: "Thesis Research",
    url: "/w/thesis/documents",
  },
  {
    type: "workspace.invitation",
    title: "You've been invited to Senior Project",
    body: "Maria invited you to collaborate as Editor.",
    workspaceId: "client",
    workspaceName: "Client Project",
    url: "/workspaces",
  },
  {
    type: "comment.reply",
    title: 'Sarah replied to your comment on "Sprint plan"',
    body: '"Agreed — let\'s pull the database migration into this sprint."',
    workspaceId: "alpha",
    workspaceName: "Project Alpha",
    url: "/w/alpha/documents",
  },
  {
    type: "task.assigned",
    title: 'Maria assigned you to "Write release notes"',
    body: "Cover the new commenting and linked-resources features.",
    workspaceId: "client",
    workspaceName: "Client Project",
    url: "/w/client/tasks",
  },
];

// Build a deterministic feed of ~80 notifications.
const NOW = Date.now();
const ALL: Notification[] = Array.from({ length: 80 }).map((_, i) => {
  const seed = SEEDS[i % SEEDS.length];
  const minutesAgo = i === 0 ? 2 : i === 1 ? 60 : i === 2 ? 180 : i * 240 + 120;
  const createdAt = new Date(NOW - minutesAgo * 60 * 1000).toISOString();
  // First 5 are unread, rest are read by default.
  const isRead = i >= 5;
  return {
    ...seed,
    id: `notif-${i + 1}`,
    createdAt,
    isRead,
    readAt: isRead ? new Date(NOW - minutesAgo * 60 * 1000 + 60_000).toISOString() : null,
  };
});

// In-memory mutable state (mock backend).
const state = {
  items: [...ALL],
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchNotifications(params: {
  page: number;
  pageSize: number;
  unreadOnly: boolean;
  category?: NotificationCategory | "all";
}): Promise<NotificationPage> {
  await wait(300);
  let filtered = params.unreadOnly ? state.items.filter((n) => !n.isRead) : state.items;
  if (params.category && params.category !== "all") {
    filtered = filtered.filter((n) => NOTIFICATION_CATEGORY[n.type] === params.category);
  }
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / params.pageSize));
  const start = (params.page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);
  return {
    data: { items },
    meta: {
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems,
        totalPages,
      },
    },
  };
}

export async function fetchUnreadCount(): Promise<{ data: { unreadCount: number } }> {
  await wait(120);
  return { data: { unreadCount: state.items.filter((n) => !n.isRead).length } };
}

export async function fetchNotificationCategoryCounts(unreadOnly: boolean): Promise<
  { data: { all: number; byCategory: Record<NotificationCategory, number> } }
> {
  await wait(120);
  const pool = unreadOnly ? state.items.filter((n) => !n.isRead) : state.items;
  const byCategory: Record<NotificationCategory, number> = {
    tasks: 0,
    documents: 0,
    comments: 0,
    workspace: 0,
    deadlines: 0,
  };
  for (const n of pool) byCategory[NOTIFICATION_CATEGORY[n.type]] += 1;
  return { data: { all: pool.length, byCategory } };
}

export async function markNotificationRead(id: string): Promise<void> {
  await wait(150);
  const target = state.items.find((n) => n.id === id);
  if (target && !target.isRead) {
    target.isRead = true;
    target.readAt = new Date().toISOString();
  }
}

export async function markAllNotificationsRead(): Promise<{ data: { updatedCount: number } }> {
  await wait(300);
  let updated = 0;
  const now = new Date().toISOString();
  for (const n of state.items) {
    if (!n.isRead) {
      n.isRead = true;
      n.readAt = now;
      updated += 1;
    }
  }
  return { data: { updatedCount: updated } };
}
