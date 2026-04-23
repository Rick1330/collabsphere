import { useEffect, useState } from "react";
import { AlertCircle, FileText, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  STATUS_LABELS,
  type TaskAssignee,
  type TaskLinkedResource,
  type TaskPriority,
  type TaskStatus,
} from "@/api/adapters/tasks";
import { LabelPicker } from "./label-picker";

export interface SourceDocumentLink {
  documentId: string;
  documentTitle: string;
  documentIcon: string;
  anchor?: { snippet: string; status: "ok" | "changed" };
}

interface CreateTaskDialogProps {
  workspaceId: string;
  presetStatus: TaskStatus;
  members: TaskAssignee[];
  /** Members the current user can assign tasks to. */
  assignableMembers: TaskAssignee[];
  currentUserId: string;
  sourceLink?: SourceDocumentLink | null;
  onClose: () => void;
  onCreated: (task: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    labels?: string[];
    sourceLink?: TaskLinkedResource;
  }) => void;
}

export const CreateTaskDialog = ({
  workspaceId,
  presetStatus,
  members,
  assignableMembers,
  currentUserId,
  sourceLink,
  onClose,
  onCreated,
}: CreateTaskDialogProps) => {
  const prefilledTitle = sourceLink?.anchor?.snippet ?? "";
  const prefilledDesc = sourceLink
    ? `From ${sourceLink.documentTitle}:\n\n"${sourceLink.anchor?.snippet ?? ""}"`
    : "";

  const [title, setTitle] = useState(prefilledTitle.slice(0, 200));
  const [description, setDescription] = useState(prefilledDesc);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [labels, setLabels] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dueError, setDueError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(prefilledTitle.slice(0, 200));
    setDescription(prefilledDesc);
  }, [prefilledTitle, prefilledDesc]);

  const today = new Date().toISOString().split("T")[0];
  const statusLabel = STATUS_LABELS[presetStatus].toUpperCase();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setTitleError(null);
    setDueError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("Title is required");
      return;
    }
    if (trimmed.length > 200) {
      setTitleError("Title must be 200 characters or fewer");
      return;
    }
    if (dueDate && dueDate < today) {
      setDueError("Due date cannot be in the past");
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 250));
      const link: TaskLinkedResource | undefined = sourceLink
        ? {
            id: `link-${Date.now()}`,
            documentId: sourceLink.documentId,
            documentTitle: sourceLink.documentTitle,
            documentIcon: sourceLink.documentIcon,
            anchor: sourceLink.anchor,
            createdAt: new Date().toISOString(),
          }
        : undefined;
      onCreated({
        title: trimmed,
        description: description.trim() || undefined,
        status: presetStatus,
        priority,
        dueDate: dueDate || undefined,
        assigneeId: assigneeId || undefined,
        labels: labels.length > 0 ? labels : undefined,
        sourceLink: link,
      });
    } catch {
      setServerError("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSelfAssignOnly =
    assignableMembers.length === 1 && assignableMembers[0].id === currentUserId;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-stone-900">New task</DialogTitle>
          <DialogDescription className="text-stone-500">
            Creating in the
            <span className="font-mono text-[11px] tracking-wider uppercase mx-1.5 px-1.5 py-0.5 rounded border bg-stone-100 text-stone-600 border-stone-200">
              {statusLabel}
            </span>
            column.
          </DialogDescription>
        </DialogHeader>

        {sourceLink && (
          <div className="mt-2 rounded-lg border border-teal-200 bg-teal-50/40 px-3 py-2.5 flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5" aria-hidden>
              {sourceLink.documentIcon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-wider text-teal-700">
                Linked from
              </div>
              <div className="text-[13px] font-semibold text-stone-900 truncate">
                {sourceLink.documentTitle}
              </div>
              {sourceLink.anchor && (
                <p className="text-[12px] text-stone-500 mt-1 italic border-l-2 border-teal-200 pl-2 leading-snug">
                  "{sourceLink.anchor.snippet}"
                </p>
              )}
            </div>
            <FileText className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="text-sm font-medium text-stone-700 mb-1.5 block"
            >
              What needs to be done?
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement login page, Review PR #42"
              autoFocus
              className="w-full h-11 px-3.5 rounded-lg text-sm bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "task-title-error" : undefined}
            />
            {titleError && (
              <p
                id="task-title-error"
                className="text-[13px] text-red-500 mt-1.5 flex items-center gap-1.5"
              >
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {titleError}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label
                htmlFor="task-desc"
                className="text-sm font-medium text-stone-700"
              >
                Description
              </label>
              <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                OPTIONAL
              </span>
            </div>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, context, or acceptance criteria..."
              rows={3}
              className="w-full rounded-lg text-sm px-3.5 py-2.5 resize-none bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
            />
          </div>

          {/* Priority + Due date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-priority"
                className="text-sm font-medium text-stone-700 mb-1.5 block"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label
                  htmlFor="task-due"
                  className="text-sm font-medium text-stone-700"
                >
                  Due date
                </label>
                <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                  OPTIONAL
                </span>
              </div>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={today}
                className="w-full h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
                aria-invalid={!!dueError}
              />
              {dueError && (
                <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" /> {dueError}
                </p>
              )}
            </div>
          </div>

          {/* Assignee */}
          {assignableMembers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label
                  htmlFor="task-assignee"
                  className="text-sm font-medium text-stone-700"
                >
                  Assignee
                </label>
                {showSelfAssignOnly && (
                  <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                    Self-assign only
                  </span>
                )}
              </div>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {assignableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                    {m.id === currentUserId ? " (you)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Labels */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-medium text-stone-700">Labels</span>
              <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                OPTIONAL
              </span>
            </div>
            <LabelPicker
              workspaceId={workspaceId}
              value={labels}
              onChange={setLabels}
              emptyLabel="Add labels"
            />
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-sm text-red-700 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              {serverError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Create task
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
