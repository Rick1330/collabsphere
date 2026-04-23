import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Lock,
  MessageSquare,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  transitionReason,
  type TaskAssignee,
  type TaskComment,
  type TaskDetail,
  type TaskLinkedResource,
  type TaskPriority,
  type TaskStatus,
} from "@/api/adapters/tasks";
import type { CommentNode } from "@/lib/mock-comments";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskCommentsThread } from "./task-comments-thread";
import { TaskLinkedResources } from "./task-linked-resources";
import { LabelPicker } from "./label-picker";

export type TaskRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

interface Props {
  workspaceId: string;
  task: TaskDetail | null;
  isLoading: boolean;
  open: boolean;
  isArchived: boolean;
  myRole: TaskRole;
  currentUserId: string;
  members: TaskAssignee[];
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, patch: Partial<TaskDetail>) => void;
  onAddComment: (taskId: string, body: CommentNode[]) => void;
  onEditComment: (taskId: string, commentId: string, body: CommentNode[]) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;
  onUnlinkResource?: (taskId: string, resourceId: string) => void;
}

export const TaskDetailSheet = ({
  workspaceId,
  task,
  isLoading,
  open,
  isArchived,
  myRole,
  currentUserId,
  members,
  onClose,
  onDelete,
  onUpdate,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onUnlinkResource,
}: Props) => {
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(myRole);
  const isReporter = task?.reporterId === currentUserId;
  const isAssignee = task?.assignee?.id === currentUserId;
  const canEdit = !isArchived && (canManage || isReporter || isAssignee);
  const canAssignOthers = !isArchived && canManage;
  const canSelfAssign = !isArchived && myRole !== "VIEWER";
  const canChangeStatus = canEdit;
  const canDelete =
    !isArchived && (canManage || (isReporter && myRole !== "VIEWER"));
  const canComment = !isArchived && myRole !== "VIEWER";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-hidden p-0 flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{task?.title ?? "Task details"}</SheetTitle>
          <SheetDescription>View and edit task details.</SheetDescription>
        </SheetHeader>

        {isLoading || !task ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg mt-4" />
          </div>
        ) : (
          <DetailBody
            workspaceId={workspaceId}
            task={task}
            isArchived={isArchived}
            canEdit={canEdit}
            canChangeStatus={canChangeStatus}
            canAssignOthers={canAssignOthers}
            canSelfAssign={canSelfAssign}
            canDelete={canDelete}
            canComment={canComment}
            currentUserId={currentUserId}
            members={members}
            onClose={onClose}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onUnlinkResource={onUnlinkResource}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

interface DetailBodyProps {
  workspaceId: string;
  task: TaskDetail;
  isArchived: boolean;
  canEdit: boolean;
  canChangeStatus: boolean;
  canAssignOthers: boolean;
  canSelfAssign: boolean;
  canDelete: boolean;
  canComment: boolean;
  currentUserId: string;
  members: TaskAssignee[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<TaskDetail>) => void;
  onAddComment: (id: string, body: CommentNode[]) => void;
  onEditComment: (id: string, cid: string, body: CommentNode[]) => void;
  onDeleteComment: (id: string, cid: string) => void;
  onUnlinkResource?: (id: string, rid: string) => void;
}

const DetailBody = ({
  workspaceId,
  task,
  isArchived,
  canEdit,
  canChangeStatus,
  canAssignOthers,
  canSelfAssign,
  canDelete,
  canComment,
  currentUserId,
  members,
  onClose,
  onDelete,
  onUpdate,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onUnlinkResource,
}: DetailBodyProps) => {
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [descEditing, setDescEditing] = useState(false);
  const [descDraft, setDescDraft] = useState(task.description ?? "");
  const [transitionError, setTransitionError] = useState<string | null>(null);

  useEffect(() => {
    setTitleDraft(task.title);
    setDescDraft(task.description ?? "");
    setTitleEditing(false);
    setDescEditing(false);
    setTransitionError(null);
  }, [task.id]);

  const allowedNextStatuses = useMemo(
    () => [task.status, ...VALID_TRANSITIONS[task.status]],
    [task.status],
  );

  const assignableMembers = useMemo(() => {
    if (canAssignOthers) return members;
    if (canSelfAssign) return members.filter((m) => m.id === currentUserId);
    return [];
  }, [canAssignOthers, canSelfAssign, members, currentUserId]);

  const handleStatusChange = (next: TaskStatus) => {
    if (!canChangeStatus) return;
    if (!canTransition(task.status, next)) {
      setTransitionError(transitionReason(task.status, next));
      return;
    }
    setTransitionError(null);
    onUpdate(task.id, { status: next });
  };

  const dueLabel = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 flex-shrink-0">
        {titleEditing ? (
          <div className="space-y-2">
            <textarea
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              rows={2}
              autoFocus
              className="w-full text-lg font-bold text-stone-900 leading-snug rounded-md border border-stone-200 px-2.5 py-2 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTitleDraft(task.title);
                  setTitleEditing(false);
                }}
                className="h-7 px-2.5 rounded-md text-[11px] font-medium text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!titleDraft.trim()}
                onClick={() => {
                  const t = titleDraft.trim();
                  if (!t) return;
                  if (t !== task.title) onUpdate(task.id, { title: t });
                  setTitleEditing(false);
                }}
                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="group">
            <h2 className="text-lg font-bold text-stone-900 pr-8 leading-snug flex items-start gap-2">
              <span className="flex-1">{task.title}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setTitleEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex-shrink-0 mt-0.5"
                  aria-label="Edit title"
                  title="Edit title"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </h2>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
          {isArchived && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
              <Lock className="h-2.5 w-2.5" /> Read-only
            </span>
          )}
          <Link
            to={`/w/${workspaceId}/tasks/${task.id}`}
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-900 px-2 py-1 rounded-md hover:bg-stone-100 transition-colors"
            title="Open full task page"
          >
            <ExternalLink className="h-3 w-3" />
            Open full page
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
        {/* Status with transition rules */}
        <div>
          <SectionLabel>Status</SectionLabel>
          {canChangeStatus ? (
            <>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
                aria-label="Change task status"
              >
                {(["backlog", "todo", "in_progress", "in_review", "done"] as TaskStatus[]).map(
                  (s) => {
                    const allowed = allowedNextStatuses.includes(s);
                    return (
                      <option key={s} value={s} disabled={!allowed}>
                        {STATUS_LABELS[s]}
                        {!allowed ? " — not allowed from here" : ""}
                      </option>
                    );
                  },
                )}
              </select>
              <p className="text-[11px] text-stone-400 mt-1">
                Allowed next:{" "}
                {VALID_TRANSITIONS[task.status]
                  .map((s) => STATUS_LABELS[s])
                  .join(", ") || "—"}
              </p>
              {transitionError && (
                <p
                  role="alert"
                  className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mt-2 flex items-start gap-1.5"
                >
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  {transitionError}
                </p>
              )}
            </>
          ) : (
            <div className="text-[12px] text-stone-500 italic">
              You don't have permission to change status.
            </div>
          )}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-5">
          {/* Assignee */}
          <div>
            <SectionLabel>Assignee</SectionLabel>
            {assignableMembers.length > 0 ? (
              <select
                value={task.assignee?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  const next =
                    id === ""
                      ? null
                      : members.find((m) => m.id === id) ?? null;
                  onUpdate(task.id, { assignee: next });
                }}
                className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {assignableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                    {m.id === currentUserId ? " (you)" : ""}
                  </option>
                ))}
              </select>
            ) : task.assignee ? (
              <div className="flex items-center gap-2 h-9">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: getAvatarColor(task.assignee.id) }}
                >
                  {getInitials(task.assignee.fullName, 1)}
                </div>
                <span className="text-sm text-stone-900 truncate">
                  {task.assignee.fullName}
                </span>
              </div>
            ) : (
              <div className="text-sm text-stone-400 italic h-9 flex items-center">
                Unassigned
              </div>
            )}
          </div>

          {/* Due date */}
          <div>
            <SectionLabel>Due date</SectionLabel>
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
                  onUpdate(task.id, {
                    dueDate: v ? new Date(v).toISOString() : null,
                  });
                }}
                className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
              />
            ) : task.dueDate ? (
              <div className="h-9 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                <span
                  className={cn(
                    "text-sm",
                    dueLabel?.isOverdue && "text-red-600 font-medium",
                    dueLabel?.isDueToday && "text-amber-600 font-medium",
                  )}
                >
                  {dueLabel?.text}
                </span>
              </div>
            ) : (
              <div className="text-sm text-stone-400 italic h-9 flex items-center">
                No due date
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <SectionLabel>Priority</SectionLabel>
            {canEdit ? (
              <select
                value={task.priority}
                onChange={(e) =>
                  onUpdate(task.id, {
                    priority: e.target.value as TaskPriority,
                  })
                }
                className="w-full h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            ) : (
              <div className="h-9 flex items-center">
                <TaskPriorityBadge priority={task.priority} />
              </div>
            )}
          </div>

          {/* Reporter */}
          <div>
            <SectionLabel>Reporter</SectionLabel>
            {task.reporterName ? (
              <div className="flex items-center gap-2 h-9">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: getAvatarColor(task.reporterId) }}
                >
                  {getInitials(task.reporterName, 1)}
                </div>
                <span className="text-sm text-stone-700 truncate">
                  {task.reporterName}
                </span>
              </div>
            ) : (
              <div className="text-sm text-stone-400 italic h-9 flex items-center">
                Unknown
              </div>
            )}
          </div>
        </div>

        {/* Labels */}
        <div>
          <SectionLabel>Labels</SectionLabel>
          <LabelPicker
            workspaceId={workspaceId}
            value={task.labels}
            onChange={(next) => onUpdate(task.id, { labels: next })}
            disabled={!canEdit}
          />
        </div>

        <Divider />

        {/* Description (plain text only) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <SectionLabel className="mb-0">Description</SectionLabel>
            {canEdit && !descEditing && (
              <button
                type="button"
                onClick={() => setDescEditing(true)}
                className="h-6 px-2 rounded-md text-[10px] font-mono uppercase tracking-wider text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
          </div>
          {descEditing ? (
            <div className="space-y-2">
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={5}
                autoFocus
                placeholder="Add description… (plain text)"
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDescDraft(task.description ?? "");
                    setDescEditing(false);
                  }}
                  className="h-7 px-2.5 rounded-md text-[11px] font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdate(task.id, {
                      description: descDraft.trim() || null,
                    });
                    setDescEditing(false);
                  }}
                  className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-teal-600 text-white hover:bg-teal-500"
                >
                  Save
                </button>
              </div>
            </div>
          ) : task.description ? (
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          ) : (
            <p className="text-sm text-stone-400 italic">
              No description provided.
            </p>
          )}
        </div>

        <Divider />

        {/* Linked resources */}
        <div>
          <SectionLabel>
            Linked documents
            {task.linkedResources.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-500 normal-case font-mono">
                {task.linkedResources.length}
              </span>
            )}
          </SectionLabel>
          <TaskLinkedResources
            workspaceId={workspaceId}
            resources={task.linkedResources}
            canManage={canEdit}
            onUnlink={
              onUnlinkResource
                ? (rid) => onUnlinkResource(task.id, rid)
                : undefined
            }
          />
        </div>

        <Divider />

        {/* Comments */}
        <div>
          <SectionLabel>
            Comments
            {task.comments.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-500 normal-case font-mono">
                {task.comments.length}
              </span>
            )}
          </SectionLabel>
          <TaskCommentsThread
            comments={task.comments}
            members={members}
            currentUserId={currentUserId}
            canComment={canComment}
            onAdd={(body) => onAddComment(task.id, body)}
            onEdit={(cid, body) => onEditComment(task.id, cid, body)}
            onDelete={(cid) => onDeleteComment(task.id, cid)}
          />
        </div>

        {canDelete && (
          <>
            <Divider />
            <div>
              <SectionLabel className="text-red-500">Danger zone</SectionLabel>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${task.title}"? This cannot be undone.`,
                    )
                  )
                    onDelete(task.id);
                }}
                className="h-8 px-3 rounded-md border border-red-200 bg-white text-red-600 text-[12px] font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete task
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-stone-200 bg-stone-50/30 flex items-center justify-between flex-shrink-0 gap-3">
        <div
          className="font-mono text-[10px] text-stone-400 tracking-wider truncate"
          title={fullDateTime(task.updatedAt)}
        >
          UPDATED {relativeTime(task.updatedAt).toUpperCase()} · CREATED{" "}
          {relativeTime(task.createdAt).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase block mb-1.5",
      className,
    )}
  >
    {children}
  </span>
);

const Divider = () => <div className="h-px bg-stone-100" />;
