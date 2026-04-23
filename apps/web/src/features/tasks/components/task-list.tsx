import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Archive, ListFilter, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import type { CommentNode } from "@/lib/mock-comments";
import { Skeleton } from "@/components/ui/skeleton";
import { useHotkey } from "@/hooks/use-hotkey";
import {
  STATUS_LABELS,
  canTransition,
  getAllLabels,
  listTasksMap,
  listWorkspaceMembers,
  toBoardItem,
  transitionReason,
  type TaskAssignee,
  type TaskComment,
  type TaskDetail,
  type TaskLinkedResource,
  type TaskPriority,
  type TaskStatus,
} from "@/api/adapters/tasks";
import { TaskPageHeader } from "./task-page-header";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskDetailSheet, type TaskRole } from "./task-detail-sheet";
import {
  TaskListTable,
  type TaskListRow,
} from "./task-list-table";
import { TaskListCards } from "./task-list-cards";
import { TaskListPagination } from "./task-list-pagination";
import { useTaskListQueryState } from "@/features/tasks/hooks/use-task-list-query-state";
import { useTaskRealtime } from "@/features/tasks/hooks/use-task-realtime";

interface TaskListProps {
  workspaceId: string;
  workspaceStatus: "active" | "archived";
  myRole: TaskRole;
}

const CURRENT_USER_ID = "user-jane";

const STATUS_ORDER: Record<TaskStatus, number> = {
  backlog: 0,
  todo: 1,
  in_progress: 2,
  in_review: 3,
  done: 4,
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const ListSkeleton = () => (
  <>
    <div className="hidden md:block rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-stone-200 bg-stone-50/70 px-4 py-2.5 flex gap-6">
        {["th-1", "th-2", "th-3", "th-4", "th-5", "th-6", "th-7"].map((id) => (
          <Skeleton key={id} className="h-3 w-14 rounded" />
        ))}
      </div>
      {["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"].map((id) => (
        <div
          key={id}
          className="border-b border-stone-100 last:border-b-0 px-4 py-2.5 flex items-center gap-4"
        >
          <div className="flex items-center gap-2.5 flex-1">
            <Skeleton className="w-0.5 h-5 rounded-full" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      ))}
    </div>
    <div className="block md:hidden space-y-2">
      {["card-1", "card-2", "card-3", "card-4"].map((id) => (
        <div
          key={id}
          className="rounded-lg border border-stone-200 bg-white p-3 space-y-2"
        >
          <Skeleton className="h-4 w-3/4 rounded" />
          <div className="flex gap-1.5">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </>
);

export const TaskList = ({
  workspaceId,
  workspaceStatus,
  myRole,
}: TaskListProps) => {
  const [tasks, setTasks] = useState<Record<string, TaskDetail>>({});
  const [members, setMembers] = useState<TaskAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const realtime = useTaskRealtime(workspaceId);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    Promise.all([listTasksMap(workspaceId), listWorkspaceMembers(workspaceId)])
      .then(([data, m]) => {
        if (cancelled) return;
        setTasks(data);
        setMembers(m);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const {
    state,
    setSearch,
    setFilters,
    setSort,
    setPage,
    setPageSize,
  } = useTaskListQueryState();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  useEffect(() => {
    if (!selectedTaskId) return;
    setSheetLoading(true);
    const t = globalThis.setTimeout(() => setSheetLoading(false), 180);
    return () => globalThis.clearTimeout(t);
  }, [selectedTaskId]);

  const isArchived = workspaceStatus === "archived";
  const canCreate =
    !isArchived && ["OWNER", "ADMIN", "MANAGER", "MEMBER"].includes(myRole);

  const navigate = useNavigate();

  // Context shortcuts: focus search, create task, switch view.
  useHotkey("/", () => {
    const el = document.querySelector<HTMLInputElement>('input[aria-label="Search tasks"]');
    el?.focus();
    el?.select();
  });
  useHotkey("n", () => {
    if (canCreate && !showCreateDialog) setShowCreateDialog(true);
  });
  useHotkey("v b", () => navigate(`/w/${workspaceId}/tasks`));
  useHotkey("v l", () => navigate(`/w/${workspaceId}/tasks/list`));

  const allTasks = useMemo(() => Object.values(tasks), [tasks]);
  const totalTaskCount = allTasks.length;
  const allLabels = useMemo(() => getAllLabels(tasks), [tasks]);

  /**
   * Server-side query simulation. In production this would be a single
   * API call with `page`, `pageSize`, `search`, filter params, `sortBy`,
   * `sortOrder`. We mirror that contract locally so the UI is shaped
   * around how the server will actually return data (filter → sort →
   * paginate; total count is pre-pagination).
   */
  const { rows, total } = useMemo(() => {
    const { search, filters, sortBy, sortOrder, page, pageSize } = state;
    const q = search.trim().toLowerCase();

    const filtered = allTasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(t.status))
        return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(t.priority))
        return false;
      if (filters.assignees.length > 0) {
        const wantUnassigned = filters.assignees.includes("__unassigned");
        if (t.assignee) {
          if (!filters.assignees.includes(t.assignee.id)) return false;
        } else if (!wantUnassigned) {
          return false;
        }
      }
      if (filters.labels.length > 0) {
        if (!t.labels.some((l) => filters.labels.includes(l))) return false;
      }
      if (filters.dueAfter) {
        if (!t.dueDate) return false;
        if (new Date(t.dueDate) < new Date(filters.dueAfter)) return false;
      }
      if (filters.dueBefore) {
        if (!t.dueDate) return false;
        if (new Date(t.dueDate) > new Date(filters.dueBefore)) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp =
            (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
          if (cmp === 0) cmp = a.position - b.position;
          break;
        case "priority":
          cmp =
            (PRIORITY_ORDER[a.priority] ?? 99) -
            (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case "assignee":
          cmp = (a.assignee?.fullName ?? "zzz").localeCompare(
            b.assignee?.fullName ?? "zzz",
          );
          break;
        case "dueDate": {
          const aD = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bD = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = aD - bD;
          break;
        }
        case "updatedAt":
          cmp =
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case "commentCount":
          cmp = (a.comments.length || a.commentCount) -
            (b.comments.length || b.commentCount);
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    const startIdx = (page - 1) * pageSize;
    const pageSlice = sorted.slice(startIdx, startIdx + pageSize);
    const rows: TaskListRow[] = pageSlice.map((t) => ({
      ...toBoardItem(t),
      updatedAt: t.updatedAt,
    }));
    return { rows, total: sorted.length };
  }, [allTasks, state]);

  const selectedTask = selectedTaskId ? (tasks[selectedTaskId] ?? null) : null;

  // Mutations
  const handleCreate = (params: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    sourceLink?: TaskLinkedResource;
  }) => {
    const id = `task-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const assignee = params.assigneeId
      ? members.find((m) => m.id === params.assigneeId) ?? null
      : null;
    const newTask: TaskDetail = {
      id,
      title: params.title,
      status: params.status,
      priority: params.priority,
      assignee,
      dueDate: params.dueDate ? new Date(params.dueDate).toISOString() : null,
      labels: [],
      commentCount: 0,
      position: Object.keys(tasks).length + 1,
      description: params.description ?? null,
      reporterId: CURRENT_USER_ID,
      reporterName: "Elshaday Tesfaye",
      createdAt: nowIso,
      updatedAt: nowIso,
      linkedResources: params.sourceLink ? [params.sourceLink] : [],
      comments: [],
    };
    setTasks((prev) => ({ ...prev, [id]: newTask }));
    setShowCreateDialog(false);
    toast.success("Task created", {
      description: `"${params.title}" added to ${STATUS_LABELS[params.status]}.`,
    });
  };

  const handleDelete = (taskId: string) => {
    setTasks((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    setSelectedTaskId(null);
    toast.success("Task deleted");
  };

  const handleUpdate = (taskId: string, patch: Partial<TaskDetail>) => {
    setTasks((prev) => {
      const cur = prev[taskId];
      if (!cur) return prev;
      if (patch.status && !canTransition(cur.status, patch.status)) {
        toast.error("Move not allowed", {
          description: transitionReason(cur.status, patch.status),
        });
        return prev;
      }
      return {
        ...prev,
        [taskId]: { ...cur, ...patch, updatedAt: new Date().toISOString() },
      };
    });
  };

  const handleAddComment = (taskId: string, body: CommentNode[]) => {
    setTasks((prev) => {
      const cur = prev[taskId];
      if (!cur) return prev;
      const c: TaskComment = {
        id: `tc-${Date.now()}`,
        authorId: CURRENT_USER_ID,
        body,
        createdAt: new Date().toISOString(),
      };
      const mention = body.find((n) => n.type === "mention");
      if (mention && mention.type === "mention") {
        toast.success(`${mention.display} will be notified`);
      }
      return {
        ...prev,
        [taskId]: {
          ...cur,
          comments: [...cur.comments, c],
          commentCount: cur.comments.length + 1,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const handleEditComment = (
    taskId: string,
    commentId: string,
    body: CommentNode[],
  ) => {
    setTasks((prev) => {
      const cur = prev[taskId];
      if (!cur) return prev;
      return {
        ...prev,
        [taskId]: {
          ...cur,
          comments: cur.comments.map((c) =>
            c.id === commentId
              ? { ...c, body, updatedAt: new Date().toISOString() }
              : c,
          ),
        },
      };
    });
  };

  const handleDeleteComment = (taskId: string, commentId: string) => {
    setTasks((prev) => {
      const cur = prev[taskId];
      if (!cur) return prev;
      return {
        ...prev,
        [taskId]: {
          ...cur,
          comments: cur.comments.filter((c) => c.id !== commentId),
          commentCount: Math.max(
            0,
            (cur.commentCount || cur.comments.length) - 1,
          ),
        },
      };
    });
  };

  const handleUnlinkResource = (taskId: string, resourceId: string) => {
    setTasks((prev) => {
      const cur = prev[taskId];
      if (!cur) return prev;
      return {
        ...prev,
        [taskId]: {
          ...cur,
          linkedResources: cur.linkedResources.filter((r) => r.id !== resourceId),
        },
      };
    });
  };

  const refetch = () => {
    setIsError(false);
    setIsLoading(true);
    globalThis.setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <div className="flex flex-col h-full" aria-busy={isLoading}>
      {isArchived && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-start sm:items-center justify-between gap-4 mx-4 sm:mx-6 mt-4 mb-2"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
              <Archive className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                This workspace is archived
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Tasks are read-only. No new tasks can be created.
              </p>
            </div>
          </div>
        </div>
      )}

      {realtime === "unavailable" && (
        <div
          role="status"
          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 mx-4 sm:mx-6 mt-3 text-[12px] text-stone-600 flex items-center justify-between gap-3"
        >
          <span>
            Live updates unavailable. The list is polling every 15 seconds.
          </span>
          <button
            type="button"
            onClick={refetch}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Refresh
          </button>
        </div>
      )}

      <div className="px-4 sm:px-6 pt-4">
        <TaskPageHeader
          workspaceId={workspaceId}
          activeView="list"
          totalTaskCount={isLoading ? undefined : totalTaskCount}
          visibleTaskCount={total}
          search={state.search}
          onSearchChange={setSearch}
          filters={state.filters}
          onFiltersChange={setFilters}
          members={members}
          allLabels={allLabels}
          canCreate={canCreate}
          onCreateTask={() => setShowCreateDialog(true)}
          realtime={realtime}
        />
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-6 overflow-y-auto">
        {isLoading && <ListSkeleton />}

        {isError && !isLoading && (
          <div
            className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center"
            role="alert"
          >
            <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
            <p className="text-sm font-semibold text-stone-900 mt-3">
              Couldn't load tasks
            </p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 h-8 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && totalTaskCount === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
            <div className="h-10 w-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
              <ListFilter className="h-5 w-5 text-stone-400" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mt-4">
              No tasks yet
            </h3>
            <p className="text-sm text-stone-500 mt-1.5">
              {canCreate
                ? "Create your first task to start tracking work."
                : "No tasks have been created yet."}
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="mt-5 h-9 px-5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto shadow-sm"
              >
                <Plus className="h-4 w-4" />
                New task
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && totalTaskCount > 0 && total === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
            <div className="h-10 w-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mt-4">
              No matching tasks
            </h3>
            <p className="text-sm text-stone-500 mt-1.5">
              No tasks match the current filters. Try adjusting your filters.
            </p>
          </div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {total} task{total !== 1 ? "s" : ""} found, showing page{" "}
              {state.page}, sorted by {state.sortBy} {state.sortOrder}ending
            </div>
            <TaskListTable
              tasks={rows}
              sortField={state.sortBy}
              sortDirection={state.sortOrder}
              onSort={setSort}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
            />
            <TaskListCards
              tasks={rows}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
            />
            <TaskListPagination
              page={state.page}
              pageSize={state.pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {showCreateDialog && (
        <CreateTaskDialog
          workspaceId={workspaceId}
          presetStatus="todo"
          members={members}
          assignableMembers={
            ["OWNER", "ADMIN", "MANAGER"].includes(myRole)
              ? members
              : members.filter((m) => m.id === CURRENT_USER_ID)
          }
          currentUserId={CURRENT_USER_ID}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleCreate}
        />
      )}

      <TaskDetailSheet
        workspaceId={workspaceId}
        open={!!selectedTaskId}
        task={selectedTask}
        isLoading={sheetLoading}
        isArchived={isArchived}
        myRole={myRole}
        currentUserId={CURRENT_USER_ID}
        members={members}
        onClose={() => setSelectedTaskId(null)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onUnlinkResource={handleUnlinkResource}
      />
    </div>
  );
};
