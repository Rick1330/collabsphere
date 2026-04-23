/**
 * Tasks API adapter.
 *
 * Canonical surface for everything task-related the UI needs:
 *  - async data reads (boards, lists, detail, members)
 *  - shared TYPES (TaskDetail, TaskStatus, …)
 *  - pure helpers that describe domain rules (canTransition, STATUS_LABELS,
 *    DEFAULT_BOARD_COLUMNS, buildBoardData)
 *
 * Components and pages MUST import from this module rather than from
 * `@/features/tasks/mocks/*`. The mock file is an implementation detail
 * that lives behind this adapter; once a real backend lands, only this
 * file changes.
 */
import {
  MOCK_TASKS,
  MOCK_WORKSPACE_MEMBERS,
  buildBoardData,
  toBoardItem,
  type TaskBoardColumn,
  type TaskBoardColumnConfig,
  type TaskBoardItem,
  type TaskDetail,
  type TaskAssignee,
} from "@/features/tasks/mocks/tasks";

// Re-export domain types + pure helpers so the UI never needs to know the
// mock file exists.
export {
  STATUS_LABELS,
  VALID_TRANSITIONS,
  canTransition,
  transitionReason,
  DEFAULT_BOARD_COLUMNS,
  buildBoardData,
  toBoardItem,
  getAllLabels,
  type TaskPriority,
  type TaskStatus,
  type TaskComment,
  type TaskLinkedResource,
} from "@/features/tasks/mocks/tasks";

export type {
  TaskBoardColumn,
  TaskBoardColumnConfig,
  TaskBoardItem,
  TaskDetail,
  TaskAssignee,
};

/**
 * Synchronous seed data exposed for board/list views that currently boot
 * from in-memory state. Components import these from the adapter (not from
 * the mock file) so the dependency direction stays UI → adapter. When the
 * backend lands, board/list will switch to `await listTasksMap()` /
 * `await listWorkspaceMembers()` and these re-exports go away.
 */
export {
  MOCK_TASKS as SEED_TASKS,
  MOCK_WORKSPACE_MEMBERS as SEED_WORKSPACE_MEMBERS,
} from "@/features/tasks/mocks/tasks";

// ---------- Async data surface (would call request() once real) ----------

export async function listBoardTasks(
  _workspaceId: string,
  columns: TaskBoardColumnConfig[],
): Promise<TaskBoardColumn[]> {
  // TODO(api): GET /workspaces/:id/tasks?view=board
  return buildBoardData(MOCK_TASKS, columns);
}

export async function listAllTasks(_workspaceId: string): Promise<TaskBoardItem[]> {
  // TODO(api): GET /workspaces/:id/tasks
  return Object.values(MOCK_TASKS).map(toBoardItem);
}

/** Snapshot of the in-memory task store. The board/detail UI mutates this
 *  via local state; once the backend is wired, callers will pass in the
 *  workspace id and receive a fresh paginated payload. */
export async function listTasksMap(
  _workspaceId: string,
): Promise<Record<string, TaskDetail>> {
  // TODO(api): GET /workspaces/:id/tasks (full payload, keyed by id)
  return MOCK_TASKS;
}

export async function getTaskDetail(taskId: string): Promise<TaskDetail | null> {
  // TODO(api): GET /tasks/:id
  return MOCK_TASKS[taskId] ?? null;
}

export async function listWorkspaceMembers(
  _workspaceId: string,
): Promise<TaskAssignee[]> {
  // TODO(api): GET /workspaces/:id/members (assignable subset)
  return MOCK_WORKSPACE_MEMBERS;
}
