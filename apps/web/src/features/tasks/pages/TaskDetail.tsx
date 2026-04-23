import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileX, Link as LinkIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import {
  WorkspaceSidebar,
  type WorkspaceForSidebar,
} from "@/features/workspace/components/workspace-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatDueDate,
  fullDateTime,
  getAvatarColor,
  getInitials,
  relativeTime,
} from "@/lib/format";
import {
  STATUS_LABELS,
  VALID_TRANSITIONS,
  canTransition,
  getTaskDetail,
  listWorkspaceMembers,
  transitionReason,
  type TaskAssignee,
  type TaskComment,
  type TaskDetail,
  type TaskPriority,
  type TaskStatus,
} from "@/api/adapters/tasks";
import type { CommentNode } from "@/lib/mock-comments";
import { TaskPriorityBadge } from "@/features/tasks/components/task-priority-badge";
import { TaskStatusBadge } from "@/features/tasks/components/task-status-badge";
import { TaskCommentsThread } from "@/features/tasks/components/task-comments-thread";
import { TaskLinkedResources } from "@/features/tasks/components/task-linked-resources";
import { LabelPicker } from "@/features/tasks/components/label-picker";
import { resolveTaskParam, resolveWorkspaceParam } from "@/lib/route-params";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };
const CURRENT_USER_ID = "user-jane";

type Role = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
type WorkspaceWithRole = WorkspaceForSidebar & { myRole: Role };

const WORKSPACES: Record<string, WorkspaceWithRole> = {
  alpha: {
    id: "alpha", name: "Project Alpha", description: "", icon: "📦",
    type: "professional", roleLabel: "TECH LEAD", status: "active", myRole: "ADMIN",
    permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
  },
  thesis: {
    id: "thesis", name: "Thesis", description: "", icon: "🎓",
    type: "academic", roleLabel: "STUDENT", status: "active", myRole: "MEMBER",
    permissions: { canCreateContent: true, canEditSettings: false, canViewAnalytics: false },
  },
  personal: {
    id: "personal", name: "Personal Notes", description: "", icon: "📝",
    type: "general", roleLabel: "OWNER", status: "active", myRole: "OWNER",
    permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: false },
  },
  research: {
    id: "research", name: "Research Group", description: "", icon: "🔬",
    type: "academic", roleLabel: "REVIEWER", status: "archived", myRole: "MEMBER",
    permissions: { canCreateContent: false, canEditSettings: true, canViewAnalytics: false },
  },
};

interface PageState {
  status: "loading" | "error" | "loaded";
  task: TaskDetail | null;
}

const TaskDetailPage = () => {
  const params = useParams();
  const workspaceId = resolveWorkspaceParam(params.workspaceId);
  const taskId = resolveTaskParam(params.taskId);
  const navigate = useNavigate();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();

  const workspace =
    WORKSPACES[workspaceId] ?? { ...WORKSPACES.alpha, id: workspaceId };
  const isArchived = workspace.status === "archived";

  const [state, setState] = useState<PageState>({ status: "loading", task: null });
  const [retry, setRetry] = useState(0);
  const [members, setMembers] = useState<TaskAssignee[]>([]);

  useEffect(() => {
    let cancelled = false;
    listWorkspaceMembers(workspaceId).then((m) => {
      if (!cancelled) setMembers(m);
    });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", task: null });
    getTaskDetail(taskId)
      .then((seed) => {
        if (cancelled) return;
        if (!seed) {
          setState({ status: "error", task: null });
          return;
        }
        // Local copy so edits stay in this page
        setState({ status: "loaded", task: { ...seed } });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", task: null });
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, retry]);

  const task = state.task;

  useEffect(() => {
    document.title = task
      ? `${task.title} — Task — CollabSphere`
      : "Task — CollabSphere";
  }, [task?.title]);

  const canManage =
    !isArchived && ["OWNER", "ADMIN", "MANAGER"].includes(workspace.myRole);
  const isReporter = task?.reporterId === CURRENT_USER_ID;
  const isAssignee = task?.assignee?.id === CURRENT_USER_ID;
  const canEdit = !isArchived && (canManage || isReporter || isAssignee);
  const canChangeStatus = canEdit;
  const canDelete =
    !isArchived && (canManage || (isReporter && workspace.myRole !== "VIEWER"));
  const canComment = !isArchived && workspace.myRole !== "VIEWER";

  const update = (patch: Partial<TaskDetail>) => {
    setState((prev) => {
      if (!prev.task) return prev;
      if (patch.status && !canTransition(prev.task.status, patch.status)) {
        toast.error("Move not allowed", {
          description: transitionReason(prev.task.status, patch.status),
        });
        return prev;
      }
      return {
        ...prev,
        task: {
          ...prev.task,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const addComment = (body: CommentNode[]) => {
    setState((prev) => {
      if (!prev.task) return prev;
      const c: TaskComment = {
        id: `tc-${Date.now()}`,
        authorId: CURRENT_USER_ID,
        body,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        task: {
          ...prev.task,
          comments: [...prev.task.comments, c],
          commentCount: prev.task.comments.length + 1,
        },
      };
    });
  };

  const editComment = (cid: string, body: CommentNode[]) =>
    setState((prev) => {
      if (!prev.task) return prev;
      return {
        ...prev,
        task: {
          ...prev.task,
          comments: prev.task.comments.map((c) =>
            c.id === cid ? { ...c, body, updatedAt: new Date().toISOString() } : c,
          ),
        },
      };
    });

  const deleteComment = (cid: string) =>
    setState((prev) => {
      if (!prev.task) return prev;
      return {
        ...prev,
        task: {
          ...prev.task,
          comments: prev.task.comments.filter((c) => c.id !== cid),
        },
      };
    });

  const unlink = (rid: string) =>
    setState((prev) => {
      if (!prev.task) return prev;
      toast.success("Resource unlinked");
      return {
        ...prev,
        task: {
          ...prev.task,
          linkedResources: prev.task.linkedResources.filter((r) => r.id !== rid),
        },
      };
    });

  const handleDelete = () => {
    if (!task) return;
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    toast.success("Task deleted");
    navigate(`/w/${workspaceId}/tasks`);
  };

  return (
    <div className="app-light min-h-screen flex bg-stone-50">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="flex-1 min-h-0 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="border-b border-stone-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
              <Link
                to={`/w/${workspaceId}/tasks`}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-stone-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to board
              </Link>
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-stone-400">
                Task · {taskId}
              </p>
            </div>
          </div>

          {state.status === "loading" && <DetailSkeleton />}

          {state.status === "error" && (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
              <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                <FileX className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-stone-900 mt-4">
                Task not found
              </h2>
              <p className="text-sm text-stone-500 mt-1.5">
                It may have been deleted or you don't have access.
              </p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setRetry((n) => n + 1)}
                  className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try again
                </button>
                <Link
                  to={`/w/${workspaceId}/tasks`}
                  className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to tasks
                </Link>
              </div>
            </div>
          )}

          {state.status === "loaded" && task && (
            <article className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
              {/* Title row */}
              <header className="mb-6">
                <div className="flex items-start gap-3 flex-wrap">
                  <TaskPriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                  {isArchived && (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                      Workspace archived · read-only
                    </span>
                  )}
                </div>
                <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold text-stone-900 tracking-tight mt-3">
                  {task.title}
                </h1>
                <p className="text-[12px] text-stone-400 font-mono mt-2">
                  Updated {relativeTime(task.updatedAt)} · created {relativeTime(task.createdAt)}
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-8">
                {/* Main column */}
                <div className="space-y-8 min-w-0">
                  <Section title="Description">
                    <DescriptionEditor
                      value={task.description}
                      canEdit={canEdit}
                      onSave={(v) => update({ description: v || null })}
                    />
                  </Section>

                  <Section
                    title="Linked documents"
                    counter={task.linkedResources.length}
                    icon={<LinkIcon className="h-3.5 w-3.5 text-stone-400" />}
                  >
                    <TaskLinkedResources
                      workspaceId={workspaceId}
                      resources={task.linkedResources}
                      canManage={canEdit}
                      onUnlink={canEdit ? unlink : undefined}
                    />
                  </Section>

                  <Section title={`Comments`} counter={task.comments.length}>
                    <TaskCommentsThread
                      comments={task.comments}
                      members={members}
                      currentUserId={CURRENT_USER_ID}
                      canComment={canComment}
                      onAdd={addComment}
                      onEdit={editComment}
                      onDelete={deleteComment}
                    />
                  </Section>

                  {canDelete && (
                    <section className="rounded-xl border border-red-200 bg-red-50/30 p-5">
                      <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-red-600 font-semibold">
                        Danger zone
                      </h2>
                      <p className="text-[13px] text-red-700/80 mt-1.5">
                        Deleting this task removes it permanently. Linked
                        documents are not affected.
                      </p>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="mt-3 h-8 px-3 rounded-md border border-red-300 bg-white text-red-700 text-[12px] font-semibold hover:bg-red-50"
                      >
                        Delete task
                      </button>
                    </section>
                  )}
                </div>

                {/* Side panel */}
                <aside className="space-y-5 lg:sticky lg:top-4 self-start">
                  {/* Status / assignment / due */}
                  <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <PanelGroup title="Workflow">
                      <PanelField label="Status">
                        {canChangeStatus ? (
                          <select
                            value={task.status}
                            onChange={(e) =>
                              update({ status: e.target.value as TaskStatus })
                            }
                            className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
                          >
                            {(["backlog", "todo", "in_progress", "in_review", "done"] as TaskStatus[]).map(
                              (s) => {
                                const allowed =
                                  s === task.status ||
                                  VALID_TRANSITIONS[task.status].includes(s);
                                return (
                                  <option key={s} value={s} disabled={!allowed}>
                                    {STATUS_LABELS[s]}
                                    {!allowed ? " — not allowed" : ""}
                                  </option>
                                );
                              },
                            )}
                          </select>
                        ) : (
                          <TaskStatusBadge status={task.status} />
                        )}
                      </PanelField>
                      <PanelField label="Priority">
                        {canEdit ? (
                          <select
                            value={task.priority}
                            onChange={(e) =>
                              update({ priority: e.target.value as TaskPriority })
                            }
                            className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        ) : (
                          <TaskPriorityBadge priority={task.priority} />
                        )}
                      </PanelField>
                    </PanelGroup>

                    <PanelGroup title="People">
                      <PanelField label="Assignee">
                        {canEdit ? (
                          <select
                            value={task.assignee?.id ?? ""}
                            onChange={(e) => {
                              const id = e.target.value;
                              const next =
                                id === ""
                                  ? null
                                  : members.find((m) => m.id === id) ?? null;
                              update({ assignee: next });
                            }}
                            className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
                          >
                            <option value="">Unassigned</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.fullName}
                                {m.id === CURRENT_USER_ID ? " (you)" : ""}
                              </option>
                            ))}
                          </select>
                        ) : task.assignee ? (
                          <PersonRow id={task.assignee.id} name={task.assignee.fullName} />
                        ) : (
                          <span className="text-sm text-stone-400 italic">Unassigned</span>
                        )}
                      </PanelField>
                      <PanelField label="Reporter">
                        {task.reporterName ? (
                          <PersonRow id={task.reporterId} name={task.reporterName} />
                        ) : (
                          <span className="text-sm text-stone-400 italic">Unknown</span>
                        )}
                      </PanelField>
                    </PanelGroup>

                    <PanelGroup title="Schedule">
                      <PanelField label="Due date">
                        {canEdit ? (
                          <input
                            type="date"
                            value={
                              task.dueDate
                                ? new Date(task.dueDate).toISOString().slice(0, 10)
                                : ""
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              update({
                                dueDate: v ? new Date(v).toISOString() : null,
                              });
                            }}
                            className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
                          />
                        ) : task.dueDate ? (
                          <DueLabel iso={task.dueDate} />
                        ) : (
                          <span className="text-sm text-stone-400 italic">No due date</span>
                        )}
                      </PanelField>
                    </PanelGroup>

                    <PanelGroup title="Labels" last>
                      <LabelPicker
                        workspaceId={workspaceId}
                        value={task.labels}
                        onChange={(next) => update({ labels: next })}
                        disabled={!canEdit}
                      />
                    </PanelGroup>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50/40 px-4 py-3">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-stone-400">
                      Audit
                    </p>
                    <p className="text-[11.5px] text-stone-500 mt-1.5">
                      Created <time title={fullDateTime(task.createdAt)}>{relativeTime(task.createdAt)}</time>
                    </p>
                    <p className="text-[11.5px] text-stone-500">
                      Updated <time title={fullDateTime(task.updatedAt)}>{relativeTime(task.updatedAt)}</time>
                    </p>
                  </div>
                </aside>
              </div>
            </article>
          )}
        </main>
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

const Section = ({
  title,
  counter,
  icon,
  children,
}: {
  title: string;
  counter?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section>
    <h2 className="flex items-center gap-2 mb-3 font-mono text-[10px] tracking-[0.2em] uppercase text-stone-500">
      {icon}
      {title}
      {typeof counter === "number" && counter > 0 && (
        <span className="ml-1 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-500">
          {counter}
        </span>
      )}
    </h2>
    {children}
  </section>
);

const PanelGroup = ({
  title,
  last = false,
  children,
}: {
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) => (
  <div className={cn("p-4", !last && "border-b border-stone-100")}>
    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-2.5">
      {title}
    </p>
    <div className="space-y-3">{children}</div>
  </div>
);

const PanelField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-[11px] font-medium text-stone-500 mb-1">{label}</p>
    {children}
  </div>
);

const PersonRow = ({ id, name }: { id: string; name: string }) => (
  <div className="flex items-center gap-2">
    <div
      className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
      style={{ backgroundColor: getAvatarColor(id) }}
    >
      {getInitials(name, 1)}
    </div>
    <span className="text-sm text-stone-900 truncate">{name}</span>
  </div>
);

const DueLabel = ({ iso }: { iso: string }) => {
  const d = formatDueDate(iso);
  return (
    <span
      className={cn(
        "text-sm",
        d.isOverdue && "text-red-600 font-medium",
        d.isDueToday && "text-amber-600 font-medium",
      )}
    >
      {d.text}
    </span>
  );
};

const DescriptionEditor = ({
  value,
  canEdit,
  onSave,
}: {
  value: string | null;
  canEdit: boolean;
  onSave: (v: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          autoFocus
          placeholder="Add description… (plain text)"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-[13.5px] text-stone-900 leading-relaxed focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none resize-y"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(value ?? "");
              setEditing(false);
            }}
            className="h-8 px-3 rounded-md text-[12px] font-medium text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft.trim());
              setEditing(false);
              toast.success("Description updated");
            }}
            className="h-8 px-3 rounded-md text-[12px] font-semibold bg-teal-600 hover:bg-teal-500 text-white"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  if (!value) {
    return (
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => setEditing(true)}
        className={cn(
          "w-full text-left rounded-lg border border-dashed px-4 py-5 text-[13px] italic transition-colors",
          canEdit
            ? "border-stone-200 text-stone-400 hover:border-stone-300 hover:bg-stone-50"
            : "border-stone-200 text-stone-300 cursor-not-allowed",
        )}
      >
        {canEdit ? "Add a description…" : "No description provided."}
      </button>
    );
  }

  return (
    <div className="group relative">
      <p className="text-[14px] text-stone-700 leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:text-stone-700 px-2 py-1 rounded-md hover:bg-stone-100"
        >
          Edit
        </button>
      )}
    </div>
  );
};

const DetailSkeleton = () => (
  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-6 w-32 rounded" />
      <Skeleton className="h-9 w-2/3 rounded" />
      <Skeleton className="h-3 w-40 rounded" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  </div>
);

export default TaskDetailPage;
