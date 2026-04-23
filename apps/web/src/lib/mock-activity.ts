// Mock activity API for the workspace activity feed.
// Generates a deterministic stream of events for a workspace and supports
// page/pageSize pagination similar to the real API contract.

export type ActivityEventKey =
  | "task.created"
  | "task.assigned"
  | "task.status_changed"
  | "task.completed"
  | "task.deleted"
  | "document.created"
  | "document.renamed"
  | "document.moved"
  | "document.locked"
  | "document.unlocked"
  | "document.version_created"
  | "document.version_restored"
  | "document.submitted"
  | "document.reviewed"
  | "workspace.member_joined"
  | "workspace.member_removed"
  | "workspace.member_role_changed"
  | "workspace.role_changed"
  | "workspace.created"
  | "workspace.archived"
  | "workspace.unarchived"
  | "comment.created"
  | "comment.resolved";

export interface ActivityActor {
  id: string;
  fullName: string;
  avatarUrl?: string;
  /** True when this actor no longer has access (left/removed/deleted). */
  isFormer?: boolean;
}

export interface ActivityResource {
  type: "document" | "task" | "comment" | "workspace";
  id: string;
  title: string;
}

export interface ActivityEvent {
  id: string;
  eventKey: ActivityEventKey;
  actor: ActivityActor;
  summary: string;
  resource?: ActivityResource;
  createdAt: string; // ISO
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ActivityPageResponse {
  data: { items: ActivityEvent[] };
  meta: { pagination: PaginationMeta };
}

// ---------------------------------------------------------------------------
// Deterministic seeded RNG so the feed looks identical between renders
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

const ACTORS: ActivityActor[] = [
  { id: "user-jane", fullName: "Elshaday Tesfaye" },
  { id: "user-bob", fullName: "Biruk Wolde" },
  { id: "user-alice", fullName: "Kidist Alemu" },
  { id: "user-mike", fullName: "Mikias Tadesse" },
  { id: "user-sara", fullName: "Sara Abebe" },
  { id: "user-omar", fullName: "Abel Solomon" },
];

/** Actors who have since left the workspace — surface as "Former member". */
const FORMER_ACTORS: ActivityActor[] = [
  { id: "user-former-1", fullName: "Former member", isFormer: true },
  { id: "user-former-2", fullName: "Deleted user", isFormer: true },
];

const DOCUMENT_TITLES = [
  "Project Roadmap Q4",
  "API Design",
  "System Architecture",
  "Onboarding Guide",
  "PRD v2",
  "Release Notes",
  "Sprint Retrospective",
  "Design System Guidelines",
];

const TASK_TITLES = [
  "Implement login flow",
  "Fix authentication bug",
  "Setup CI pipeline",
  "Design system tokens",
  "Migrate to TanStack Query",
  "Add dark mode toggle",
  "Refactor task board",
  "Update documentation",
];

const ROLE_LABELS = ["Developer", "Designer", "Reviewer", "Manager", "Editor"];

const STATUS_TRANSITIONS: Array<[string, string]> = [
  ["Backlog", "To Do"],
  ["To Do", "In Progress"],
  ["In Progress", "In Review"],
  ["In Review", "Done"],
];

interface BuildContext {
  rand: () => number;
  pickActor: () => ActivityActor;
  pickDoc: () => string;
  pickTask: () => string;
  pickRole: () => string;
  pickStatus: () => [string, string];
}

function buildEvent(index: number, ctx: BuildContext, createdAt: string): ActivityEvent {
  const eventKeys: ActivityEventKey[] = [
    "task.created",
    "task.assigned",
    "task.status_changed",
    "task.completed",
    "document.created",
    "document.renamed",
    "document.locked",
    "document.unlocked",
    "document.version_created",
    "document.submitted",
    "document.reviewed",
    "comment.created",
    "comment.resolved",
    "workspace.member_joined",
    "workspace.member_role_changed",
    "workspace.role_changed",
    "task.deleted",
    "document.moved",
    "document.version_restored",
  ];

  const eventKey = eventKeys[Math.floor(ctx.rand() * eventKeys.length)];
  // ~5% of events come from former / deleted actors so the UI handles that
  // gracefully ("Former member"). Rest come from active actors.
  const actor =
    ctx.rand() < 0.05
      ? FORMER_ACTORS[Math.floor(ctx.rand() * FORMER_ACTORS.length)]
      : ctx.pickActor();
  let summary = "";
  let resource: ActivityResource | undefined;

  switch (eventKey) {
    case "task.created": {
      const title = ctx.pickTask();
      summary = `${actor.fullName} created task`;
      resource = { type: "task", id: `task-${index}`, title };
      break;
    }
    case "task.assigned": {
      const title = ctx.pickTask();
      const assignee = ctx.pickActor();
      summary = `${actor.fullName} assigned to ${assignee.fullName}`;
      resource = { type: "task", id: `task-${index}`, title };
      break;
    }
    case "task.status_changed": {
      const title = ctx.pickTask();
      const [from, to] = ctx.pickStatus();
      summary = `${actor.fullName} moved status from ${from} to ${to}`;
      resource = { type: "task", id: `task-${index}`, title };
      break;
    }
    case "task.completed": {
      const title = ctx.pickTask();
      summary = `${actor.fullName} completed task`;
      resource = { type: "task", id: `task-${index}`, title };
      break;
    }
    case "task.deleted": {
      const title = ctx.pickTask();
      summary = `${actor.fullName} deleted task`;
      resource = { type: "task", id: `task-${index}`, title };
      break;
    }
    case "document.created": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} created document`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "document.renamed": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} renamed document`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "document.moved": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} moved document to a new folder`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "document.locked": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} locked document`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "document.unlocked": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} unlocked document`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "document.version_created": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} created a version snapshot of`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "document.version_restored": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} restored a previous version of`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "workspace.member_joined": {
      const role = ctx.pickRole();
      summary = `${actor.fullName} joined the workspace as ${role}`;
      break;
    }
    case "workspace.member_removed": {
      const removed = ctx.pickActor();
      summary = `${actor.fullName} removed ${removed.fullName} from the workspace`;
      break;
    }
    case "workspace.member_role_changed":
    case "workspace.role_changed": {
      const target = ctx.pickActor();
      const role = ctx.pickRole();
      summary = `${actor.fullName} changed ${target.fullName}'s role to ${role}`;
      break;
    }
    case "workspace.created": {
      summary = `${actor.fullName} created the workspace`;
      break;
    }
    case "workspace.archived": {
      summary = `${actor.fullName} archived the workspace`;
      break;
    }
    case "workspace.unarchived": {
      summary = `${actor.fullName} restored the workspace from archive`;
      break;
    }
    case "document.submitted": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} submitted for review`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "document.reviewed": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} reviewed`;
      resource = { type: "document", id: `doc-${index}`, title };
      break;
    }
    case "comment.created": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} commented on`;
      resource = { type: "comment", id: `comment-${index}`, title };
      break;
    }
    case "comment.resolved": {
      const title = ctx.pickDoc();
      summary = `${actor.fullName} resolved a comment thread on`;
      resource = { type: "comment", id: `comment-${index}`, title };
      break;
    }
  }

  return {
    id: `event-${index}`,
    eventKey,
    actor,
    summary,
    resource,
    createdAt,
  };
}

function generateAllEvents(workspaceId: string): ActivityEvent[] {
  const seed = seedFromString(workspaceId || "workspace");
  const rand = mulberry32(seed);

  const ctx: BuildContext = {
    rand,
    pickActor: () => ACTORS[Math.floor(rand() * ACTORS.length)],
    pickDoc: () => DOCUMENT_TITLES[Math.floor(rand() * DOCUMENT_TITLES.length)],
    pickTask: () => TASK_TITLES[Math.floor(rand() * TASK_TITLES.length)],
    pickRole: () => ROLE_LABELS[Math.floor(rand() * ROLE_LABELS.length)],
    pickStatus: () => STATUS_TRANSITIONS[Math.floor(rand() * STATUS_TRANSITIONS.length)],
  };

  // Spread events across the past ~45 days, denser at the top.
  const totalEvents = 248;
  const now = Date.now();
  const events: ActivityEvent[] = [];

  let cursor = now;
  for (let i = 0; i < totalEvents; i++) {
    // Step backward in time by a randomized amount (smaller steps for newer
    // events, larger steps further back).
    const baseStep = i < 10 ? 1000 * 60 * 30 : i < 30 ? 1000 * 60 * 90 : 1000 * 60 * 60 * 5;
    const jitter = rand() * baseStep;
    cursor -= baseStep + jitter;
    const createdAt = new Date(cursor).toISOString();
    events.push(buildEvent(i, ctx, createdAt));
  }

  return events;
}

const cache = new Map<string, ActivityEvent[]>();

function getEvents(workspaceId: string): ActivityEvent[] {
  if (!cache.has(workspaceId)) {
    cache.set(workspaceId, generateAllEvents(workspaceId));
  }
  return cache.get(workspaceId)!;
}

export interface FetchActivityParams {
  page: number;
  pageSize: number;
}

export async function fetchWorkspaceActivityPaginated(
  workspaceId: string,
  params: FetchActivityParams,
): Promise<ActivityPageResponse> {
  // Simulate network latency.
  await new Promise((resolve) => setTimeout(resolve, 220));

  const all = getEvents(workspaceId);
  const totalItems = all.length;
  const pageSize = Math.max(1, params.pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  return {
    data: { items },
    meta: { pagination: { page, pageSize, totalItems, totalPages } },
  };
}
