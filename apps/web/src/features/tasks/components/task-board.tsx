import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Archive,
  KanbanSquare,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useHotkey } from "@/hooks/use-hotkey";
import type { CommentNode } from "@/lib/mock-comments";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildBoardData,
  DEFAULT_BOARD_COLUMNS,
  STATUS_LABELS,
  canTransition,
  getAllLabels,
  listTasksMap,
  listWorkspaceMembers,
  transitionReason,
  type TaskAssignee,
  type TaskBoardColumn,
  type TaskComment,
  type TaskDetail,
  type TaskLinkedResource,
  type TaskPriority,
  type TaskStatus,
} from "@/api/adapters/tasks";
import { TaskPageHeader } from "./task-page-header";
import { TaskColumn } from "./task-column";
import { CreateTaskDialog, type SourceDocumentLink } from "./create-task-dialog";
import { TaskDetailSheet, type TaskRole } from "./task-detail-sheet";
import {
  EMPTY_FILTERS,
  type AdvancedFilterState,
} from "./task-advanced-filters";
import { useTaskRealtime } from "@/features/tasks/hooks/use-task-realtime";

interface TaskBoardProps {
  workspaceId: string;
  workspaceName: string;
  workspaceStatus: "active" | "archived";
  myRole: TaskRole;
}

const CURRENT_USER_ID = "user-jane";

const BoardSkeleton = () => (
  <div className="flex gap-4 px-4 py-4 overflow-x-auto h-full">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="min-w-[272px] max-w-[300px] w-full rounded-xl bg-stone-50/70 border border-stone-200/60 flex flex-col self-start"
      >
        <div className="px-3 py-2.5 border-b border-stone-200/40 flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3.5 w-16 rounded" />
          <Skeleton className="h-3 w-4 rounded" />
        </div>
        <div className="px-2 py-2 space-y-2 flex-1">
          {Array.from({ length: Math.max(3 - i, 1) }).map((_, j) => (
            <div
              key={j}
              className="rounded-lg border border-stone-200 bg-white p-3 space-y-2"
            >
              <Skeleton className="h-4 w-4/5 rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-10 rounded" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const TaskBoard = ({
  workspaceId,
  workspaceStatus,
  myRole,
}: TaskBoardProps) => {
  const [tasks, setTasks] = useState<Record<string, TaskDetail>>({});
  const [members, setMembers] = useState<TaskAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const realtime = useTaskRealtime(workspaceId);
  const navigate = useNavigate();

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

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdvancedFilterState>(EMPTY_FILTERS);
  const [createDialogStatus, setCreateDialogStatus] = useState<TaskStatus | null>(
    null,
  );
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

  const allLabels = useMemo(() => getAllLabels(tasks), [tasks]);

  const boardColumns: TaskBoardColumn[] = useMemo(
    () => buildBoardData(tasks, DEFAULT_BOARD_COLUMNS),
    [tasks],
  );

  const filteredColumns = useMemo(() => {
    const q = search.trim().toLowerCase();
    return boardColumns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        if (q && !task.title.toLowerCase().includes(q)) return false;
        if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority))
          return false;
        if (filters.statuses.length > 0 && !filters.statuses.includes(task.status))
          return false;
        if (filters.assignees.length > 0) {
          const wantUnassigned = filters.assignees.includes("__unassigned");
          if (task.assignee) {
            if (!filters.assignees.includes(task.assignee.id)) return false;
          } else if (!wantUnassigned) {
            return false;
          }
        }
        if (filters.labels.length > 0) {
          if (!task.labels.some((l) => filters.labels.includes(l))) return false;
        }
        if (filters.dueAfter) {
          if (!task.dueDate) return false;
          if (new Date(task.dueDate) < new Date(filters.dueAfter)) return false;
        }
        if (filters.dueBefore) {
          if (!task.dueDate) return false;
          if (new Date(task.dueDate) > new Date(filters.dueBefore)) return false;
        }
        return true;
      }),
    }));
  }, [boardColumns, search, filters]);

  const totalTaskCount = boardColumns.reduce((s, c) => s + c.tasks.length, 0);
  const visibleTaskCount = filteredColumns.reduce((s, c) => s + c.tasks.length, 0);
  const isFiltered =
    search.trim().length > 0 ||
    filters.statuses.length +
      filters.assignees.length +
      filters.priorities.length +
      filters.labels.length +
      (filters.dueAfter ? 1 : 0) +
      (filters.dueBefore ? 1 : 0) >
      0;

  const selectedTask = selectedTaskId ? (tasks[selectedTaskId] ?? null) : null;

  // Context shortcuts — only fire on the board page, never inside inputs.
  useHotkey("/", () => {
    const el = document.querySelector<HTMLInputElement>('input[aria-label="Search tasks"]');
    el?.focus();
    el?.select();
  });
  useHotkey("n", () => {
    if (canCreate && !createDialogStatus) setCreateDialogStatus("todo");
  });
  useHotkey("v b", () => navigate(`/w/${workspaceId}/tasks`));
  useHotkey("v l", () => navigate(`/w/${workspaceId}/tasks/list`));

  // Mutations
  const handleCreate = (params: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    labels?: string[];
    sourceLink?: TaskLinkedResource;
  }) => {
    const id = `task-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const assignee =
      params.assigneeId
        ? members.find((m) => m.id === params.assigneeId) ?? null
        : null;
    const newTask: TaskDetail = {
      id,
      title: params.title,
      status: params.status,
      priority: params.priority,
      assignee,
      dueDate: params.dueDate ? new Date(params.dueDate).toISOString() : null,
      labels: params.labels ?? [],
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
    setCreateDialogStatus(null);
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
      // Enforce status transition rules at the data layer too
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
          commentCount: Math.max(0, (cur.commentCount || cur.comments.length) - 1),
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

  const sourceLink: SourceDocumentLink | null = null;

  return (
    <div className="flex flex-col h-full min-h-0" aria-busy={isLoading}>
      {isArchived && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-start sm:items-center justify-between gap-4 mx-4 mt-4 mb-2"
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
          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 mx-4 mt-3 text-[12px] text-stone-600 flex items-center justify-between gap-3"
        >
          <span>
            Live updates unavailable. The board is polling every 15 seconds.
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
          activeView="board"
          totalTaskCount={isLoading ? undefined : totalTaskCount}
          visibleTaskCount={isFiltered ? visibleTaskCount : undefined}
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
          members={members}
          allLabels={allLabels}
          canCreate={canCreate}
          onCreateTask={() => setCreateDialogStatus("todo")}
          realtime={realtime}
        />
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {isLoading && <BoardSkeleton />}

        {isError && !isLoading && (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-sm" role="alert">
              <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-stone-900 mt-4">
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
          </div>
        )}

        {!isLoading && !isError && totalTaskCount === 0 && (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-sm">
              <div className="h-12 w-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
                <KanbanSquare className="h-6 w-6 text-stone-400" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 mt-4">
                No tasks yet
              </h3>
              <p className="text-sm text-stone-500 mt-1.5">
                {canCreate
                  ? "Create your first task to start tracking your team's work."
                  : "No tasks have been created in this workspace yet."}
              </p>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setCreateDialogStatus("todo")}
                  className="mt-5 h-9 px-5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  New task
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading &&
          !isError &&
          totalTaskCount > 0 &&
          visibleTaskCount === 0 && (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-sm">
                <div className="h-12 w-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
                  <KanbanSquare className="h-6 w-6 text-stone-400" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mt-4">
                  No tasks match these filters
                </h3>
                <p className="text-sm text-stone-500 mt-1.5">
                  Try removing a filter to see more results.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilters(EMPTY_FILTERS);
                  }}
                  className="mt-5 h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors mx-auto"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

        {!isLoading && !isError && totalTaskCount > 0 && visibleTaskCount > 0 && (
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 px-4 sm:px-6 py-4 min-w-max h-full items-start">
              {filteredColumns.map((column) => (
                <TaskColumn
                  key={column.status}
                  status={column.status}
                  label={column.label}
                  tasks={column.tasks}
                  canCreate={canCreate}
                  onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                  onAddTask={(status) => setCreateDialogStatus(status)}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !isError && totalTaskCount > 0 && (
          <div className="md:hidden px-4 pb-4">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-stone-500">
                List view is recommended on mobile.
              </span>
              <Link
                to={`/w/${workspaceId}/tasks/list`}
                className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex-shrink-0"
              >
                Switch to list →
              </Link>
            </div>
          </div>
        )}
      </div>

      {createDialogStatus && (
        <CreateTaskDialog
          workspaceId={workspaceId}
          presetStatus={createDialogStatus}
          members={members}
          assignableMembers={
            ["OWNER", "ADMIN", "MANAGER"].includes(myRole)
              ? members
              : members.filter((m) => m.id === CURRENT_USER_ID)
          }
          currentUserId={CURRENT_USER_ID}
          sourceLink={sourceLink}
          onClose={() => setCreateDialogStatus(null)}
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
