// Shared task types + mock data covering: board, list, detail, comments,
// linked document resources, transition rules, mention support.
//
// This is the single source of truth used by both the board and list
// surfaces, so what the user sees stays consistent everywhere.

import type { CommentNode } from "@/lib/mock-comments";

export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";

export interface TaskAssignee {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface TaskLinkedResource {
  id: string;
  documentId: string;
  documentTitle: string;
  documentIcon: string;
  /** Optional anchor preview excerpt of the linked text */
  anchor?: { snippet: string; status: "ok" | "changed" };
  createdAt: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  body: CommentNode[];
  createdAt: string;
  updatedAt?: string;
  resolved?: boolean;
  parentId?: string | null;
}

export interface TaskBoardItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: TaskAssignee | null;
  dueDate: string | null;
  labels: string[];
  commentCount: number;
  position: number;
  linkedResourceCount?: number;
}

export interface TaskDetail extends TaskBoardItem {
  description: string | null;
  reporterId: string;
  reporterName: string | null;
  createdAt: string;
  updatedAt: string;
  linkedResources: TaskLinkedResource[];
  comments: TaskComment[];
}

/**
 * Display column != canonical status. The board only shows the four
 * working columns; `backlog` is a real status reachable from filters
 * and from the detail status dropdown.
 */
export interface TaskBoardColumnConfig {
  status: TaskStatus;
  /** Display label, may differ from status label (e.g. "Testing" → in_review) */
  label: string;
}

export interface TaskBoardColumn extends TaskBoardColumnConfig {
  tasks: TaskBoardItem[];
}

export const DEFAULT_BOARD_COLUMNS: TaskBoardColumnConfig[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review", label: "Testing" }, // canonical: in_review, display: Testing
  { status: "done", label: "Done" },
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

/**
 * Canonical workflow transitions. Anything not in here is an invalid move
 * and the UI must explain why instead of silently snapping back.
 */
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["todo"],
  todo: ["backlog", "in_progress"],
  in_progress: ["in_review", "todo"],
  in_review: ["in_progress", "done"],
  done: ["in_progress"],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionReason(from: TaskStatus, to: TaskStatus): string {
  if (from === to) return "Already in this column.";
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (allowed.length === 0) return `Tasks in ${STATUS_LABELS[from]} cannot be moved.`;
  return `Move ${STATUS_LABELS[from]} → ${STATUS_LABELS[to]} is not allowed. Allowed: ${allowed
    .map((s) => STATUS_LABELS[s])
    .join(", ")}.`;
}

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const iso = (msOffset: number) => new Date(now + msOffset).toISOString();

const MEMBERS: TaskAssignee[] = [
  { id: "user-jane", fullName: "Elshaday Tesfaye", avatarUrl: null },
  { id: "user-bob", fullName: "Eyob Bekele", avatarUrl: null },
  { id: "user-alex", fullName: "Yonas Girma", avatarUrl: null },
  { id: "user-mira", fullName: "Hiwot Mengistu", avatarUrl: null },
  { id: "user-sam", fullName: "Samuel Haile", avatarUrl: null },
];

export const MOCK_WORKSPACE_MEMBERS = MEMBERS;

const text = (s: string): CommentNode => ({ type: "text", text: s });
const mention = (userId: string, display: string): CommentNode => ({
  type: "mention",
  userId,
  display,
});

let pos = 0;
const next = () => ++pos;

export const MOCK_TASKS: Record<string, TaskDetail> = {
  "task-1": {
    id: "task-1",
    title: "Implement login page with email + password and OAuth providers",
    status: "todo",
    priority: "urgent",
    assignee: MEMBERS[0],
    dueDate: iso(-2 * day),
    labels: ["frontend", "auth"],
    commentCount: 2,
    linkedResourceCount: 1,
    position: next(),
    description:
      "Build the login UI and connect to the auth endpoints. Include email/password, Google OAuth, and Apple OAuth. Validate with Zod and show inline errors.",
    reporterId: "user-bob",
    reporterName: "Eyob Bekele",
    createdAt: iso(-5 * day),
    updatedAt: iso(-1 * day),
    linkedResources: [
      {
        id: "link-1",
        documentId: "d-prd",
        documentTitle: "PRD v2",
        documentIcon: "📄",
        anchor: { snippet: "Login must support email + Google + Apple", status: "ok" },
        createdAt: iso(-4 * day),
      },
    ],
    comments: [
      {
        id: "tc-1",
        authorId: "user-bob",
        body: [text("Going to need this before Friday demo. "), mention("user-jane", "Elshaday Tesfaye"), text(" can you take this?")],
        createdAt: iso(-3 * day),
      },
      {
        id: "tc-2",
        authorId: "user-jane",
        body: [text("On it. Will start with the email path, OAuth after.")],
        createdAt: iso(-2 * day),
      },
    ],
  },
  "task-2": {
    id: "task-2",
    title: "Design the dashboard component system",
    status: "todo",
    priority: "medium",
    assignee: MEMBERS[2],
    dueDate: iso(7 * day),
    labels: ["design", "system"],
    commentCount: 0,
    position: next(),
    description: "Pick the layout patterns and tokens that the dashboard will use across pages.",
    reporterId: "user-jane",
    reporterName: "Elshaday Tesfaye",
    createdAt: iso(-3 * day),
    updatedAt: iso(-2 * day),
    linkedResources: [],
    comments: [],
  },
  "task-3": {
    id: "task-3",
    title: "Write the user-facing onboarding documentation",
    status: "todo",
    priority: "low",
    assignee: null,
    dueDate: null,
    labels: ["docs"],
    commentCount: 0,
    position: next(),
    description: null,
    reporterId: "user-jane",
    reporterName: "Elshaday Tesfaye",
    createdAt: iso(-7 * day),
    updatedAt: iso(-7 * day),
    linkedResources: [],
    comments: [],
  },
  "task-4": {
    id: "task-4",
    title: "Fix login bug — session not refreshing after token rotation",
    status: "in_progress",
    priority: "high",
    assignee: MEMBERS[1],
    dueDate: iso(0),
    labels: ["bug", "auth"],
    commentCount: 4,
    linkedResourceCount: 2,
    position: next(),
    description:
      "After rotation, the next request still uses the stale access token. Investigate the interceptor order in the API client.",
    reporterId: "user-jane",
    reporterName: "Elshaday Tesfaye",
    createdAt: iso(-2 * day),
    updatedAt: iso(-1 * day),
    linkedResources: [
      {
        id: "link-2",
        documentId: "d-api",
        documentTitle: "API Design",
        documentIcon: "📐",
        anchor: { snippet: "Auth interceptor must read latest token before retry", status: "ok" },
        createdAt: iso(-2 * day),
      },
      {
        id: "link-3",
        documentId: "d-adr",
        documentTitle: "ADR-003 Prisma",
        documentIcon: "📑",
        anchor: { snippet: "Token rotation policy", status: "changed" },
        createdAt: iso(-1 * day),
      },
    ],
    comments: [
      {
        id: "tc-3",
        authorId: "user-bob",
        body: [text("Reproduced on staging. Happens after ~15min idle.")],
        createdAt: iso(-1 * day),
      },
      {
        id: "tc-4",
        authorId: "user-alex",
        body: [mention("user-bob", "Eyob Bekele"), text(" interceptor order looks wrong in `client.ts`")],
        createdAt: iso(-day + 60 * 60 * 1000),
      },
      {
        id: "tc-5",
        authorId: "user-bob",
        body: [text("Good catch. Fix in PR #58, please review.")],
        createdAt: iso(-day + 2 * 60 * 60 * 1000),
      },
      {
        id: "tc-6",
        authorId: "user-jane",
        body: [text("LGTM, merging.")],
        createdAt: iso(-2 * 60 * 60 * 1000),
      },
    ],
  },
  "task-5": {
    id: "task-5",
    title: "Build API endpoints for the task board view",
    status: "in_progress",
    priority: "urgent",
    assignee: MEMBERS[0],
    dueDate: iso(8 * day),
    labels: ["backend"],
    commentCount: 1,
    position: next(),
    description: "Group by status, support filters, return the board envelope.",
    reporterId: "user-bob",
    reporterName: "Eyob Bekele",
    createdAt: iso(-4 * day),
    updatedAt: iso(-1 * day),
    linkedResources: [],
    comments: [
      {
        id: "tc-7",
        authorId: "user-jane",
        body: [text("Pagination on the list endpoint is the priority.")],
        createdAt: iso(-day),
      },
    ],
  },
  "task-6": {
    id: "task-6",
    title: "Refactor auth module — split provider strategies",
    status: "in_progress",
    priority: "medium",
    assignee: MEMBERS[1],
    dueDate: iso(14 * day),
    labels: ["refactor"],
    commentCount: 0,
    position: next(),
    description: null,
    reporterId: "user-bob",
    reporterName: "Eyob Bekele",
    createdAt: iso(-1 * day),
    updatedAt: iso(-1 * day),
    linkedResources: [],
    comments: [],
  },
  "task-7": {
    id: "task-7",
    title: "Review PR #42 — onboarding flow",
    status: "in_review",
    priority: "high",
    assignee: MEMBERS[2],
    dueDate: iso(3 * day),
    labels: ["review"],
    commentCount: 6,
    position: next(),
    description: "End-to-end review of the onboarding flow PR. Check accessibility and copy.",
    reporterId: "user-jane",
    reporterName: "Elshaday Tesfaye",
    createdAt: iso(-2 * day),
    updatedAt: iso(-1 * day),
    linkedResources: [],
    comments: [],
  },
  "task-8": {
    id: "task-8",
    title: "Test the auth flow on staging across all browsers",
    status: "in_review",
    priority: "medium",
    assignee: null,
    dueDate: null,
    labels: ["qa"],
    commentCount: 0,
    position: next(),
    description: null,
    reporterId: "user-jane",
    reporterName: "Elshaday Tesfaye",
    createdAt: iso(-1 * day),
    updatedAt: iso(-1 * day),
    linkedResources: [],
    comments: [],
  },
  "task-9": {
    id: "task-9",
    title: "Review documentation pass on the API reference",
    status: "in_review",
    priority: "medium",
    assignee: MEMBERS[1],
    dueDate: iso(5 * day),
    labels: ["docs"],
    commentCount: 1,
    position: next(),
    description: null,
    reporterId: "user-jane",
    reporterName: "Elshaday Tesfaye",
    createdAt: iso(-3 * day),
    updatedAt: iso(-1 * day),
    linkedResources: [],
    comments: [],
  },
  "task-10": {
    id: "task-10",
    title: "Set up CI/CD pipeline with GitHub Actions",
    status: "done",
    priority: "medium",
    assignee: MEMBERS[0],
    dueDate: iso(-3 * day),
    labels: ["infra"],
    commentCount: 2,
    position: next(),
    description: "Build, test, and deploy on push to main.",
    reporterId: "user-bob",
    reporterName: "Eyob Bekele",
    createdAt: iso(-12 * day),
    updatedAt: iso(-3 * day),
    linkedResources: [],
    comments: [],
  },
  "task-11": {
    id: "task-11",
    title: "Database setup — Postgres with Prisma migrations",
    status: "done",
    priority: "low",
    assignee: MEMBERS[3],
    dueDate: null,
    labels: ["infra", "db"],
    commentCount: 0,
    position: next(),
    description: null,
    reporterId: "user-bob",
    reporterName: "Eyob Bekele",
    createdAt: iso(-15 * day),
    updatedAt: iso(-10 * day),
    linkedResources: [],
    comments: [],
  },
  "task-12": {
    id: "task-12",
    title: "Initial project scaffolding and tooling",
    status: "done",
    priority: "medium",
    assignee: MEMBERS[0],
    dueDate: null,
    labels: [],
    commentCount: 0,
    position: next(),
    description: null,
    reporterId: "user-jane",
    reporterName: "Elshaday Tesfaye",
    createdAt: iso(-20 * day),
    updatedAt: iso(-18 * day),
    linkedResources: [],
    comments: [],
  },
  "task-13": {
    id: "task-13",
    title: "Triage incoming bug reports from beta users",
    status: "backlog",
    priority: "low",
    assignee: null,
    dueDate: null,
    labels: ["bug", "triage"],
    commentCount: 0,
    position: next(),
    description: null,
    reporterId: "user-jane",
    reporterName: "Elshaday Tesfaye",
    createdAt: iso(-1 * day),
    updatedAt: iso(-1 * day),
    linkedResources: [],
    comments: [],
  },
};

/** All distinct labels across the workspace, for the label filter. */
export function getAllLabels(tasks: Record<string, TaskDetail>): string[] {
  const set = new Set<string>();
  for (const t of Object.values(tasks)) for (const l of t.labels) set.add(l);
  return Array.from(set).sort((left, right) => left.localeCompare(right));
}

export function buildBoardData(
  tasks: Record<string, TaskDetail>,
  columns: TaskBoardColumnConfig[] = DEFAULT_BOARD_COLUMNS,
): TaskBoardColumn[] {
  return columns.map((col) => ({
    status: col.status,
    label: col.label,
    tasks: Object.values(tasks)
      .filter((t) => t.status === col.status)
      .sort((a, b) => a.position - b.position)
      .map(toBoardItem),
  }));
}

export function toBoardItem(t: TaskDetail): TaskBoardItem {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee,
    dueDate: t.dueDate,
    labels: t.labels,
    commentCount: t.comments.length || t.commentCount,
    position: t.position,
    linkedResourceCount: t.linkedResources?.length ?? t.linkedResourceCount,
  };
}
