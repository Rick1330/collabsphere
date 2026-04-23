import { Calendar, Link as LinkIcon, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDueDate, getAvatarColor, getInitials } from "@/lib/format";
import type { TaskBoardItem } from "@/api/adapters/tasks";
import { TaskPriorityBadge } from "./task-priority-badge";

/**
 * TaskCard — card-grade richness, not a generic tile.
 *
 * Composition:
 *   1. Title row (with assignee avatar pinned right for instant scanning)
 *   2. Priority + due date (the two highest-signal facts)
 *   3. Labels + meta footer (comments, links)
 *
 * Priority owns the left edge as a colored rail. The card lifts on hover
 * with shadow + slight translate to feel kinetic.
 */
interface TaskCardProps {
  task: TaskBoardItem;
  onClick: () => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-lg bg-white p-2.5",
        "border border-stone-200 shadow-sm",
        "transition-all duration-150",
        "hover:shadow-md hover:border-stone-300 hover:-translate-y-[1px]",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-teal-500/50 focus-visible:ring-offset-1",
        "cursor-pointer relative",
        task.priority === "urgent" && "border-l-[3px] border-l-red-500",
        task.priority === "high" && "border-l-[3px] border-l-amber-500",
        task.priority === "medium" && "border-l-[3px] border-l-teal-500",
        task.priority === "low" && "border-l-[3px] border-l-stone-300",
      )}
      aria-label={`Task: ${task.title}`}
    >
      {/* Row 1 — title + assignee pinned right */}
      <div className="flex items-start gap-2">
        <p className="flex-1 text-[13px] font-medium text-stone-900 leading-snug line-clamp-2">
          {task.title}
        </p>
        {task.assignee ? (
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 shadow-sm ring-1 ring-white"
            style={{ backgroundColor: getAvatarColor(task.assignee.id) }}
            title={task.assignee.fullName}
            aria-label={`Assigned to ${task.assignee.fullName}`}
          >
            {getInitials(task.assignee.fullName, 1)}
          </div>
        ) : (
          <span
            className="h-5 w-5 rounded-full flex items-center justify-center border border-dashed border-stone-300 text-[10px] font-mono text-stone-300 flex-shrink-0"
            aria-label="Unassigned"
            title="Unassigned"
          >
            ?
          </span>
        )}
      </div>

      {/* Row 2 — priority + due (highest signal) */}
      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        <TaskPriorityBadge priority={task.priority} />
        {due && (
          <span
            className={cn(
              "text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded flex items-center gap-1 leading-none border",
              due.isOverdue && "bg-red-50 text-red-700 border-red-200",
              due.isDueToday && "bg-amber-50 text-amber-700 border-amber-200",
              !due.isOverdue &&
                !due.isDueToday &&
                "text-stone-500 border-stone-200 bg-stone-50",
            )}
          >
            <Calendar className="h-3 w-3" />
            {due.isOverdue
              ? "OVERDUE"
              : due.isDueToday
                ? "TODAY"
                : new Date(task.dueDate!)
                    .toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                    .toUpperCase()}
          </span>
        )}
      </div>

      {/* Row 3 — labels + meta */}
      {(task.labels.length > 0 ||
        task.commentCount > 0 ||
        (task.linkedResourceCount ?? 0) > 0) && (
        <div className="flex items-center justify-between mt-2 gap-2 pt-2 border-t border-stone-100">
          <div className="flex gap-1 min-w-0 flex-1 flex-wrap">
            {task.labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200 truncate max-w-[80px] leading-none"
              >
                {label}
              </span>
            ))}
            {task.labels.length > 2 && (
              <span className="text-[9px] text-stone-400 font-mono leading-none self-center">
                +{task.labels.length - 2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-stone-400">
            {task.commentCount > 0 && (
              <span className="text-[10px] flex items-center gap-0.5 font-mono tabular-nums">
                <MessageSquare className="h-3 w-3" />
                {task.commentCount}
              </span>
            )}
            {!!task.linkedResourceCount && task.linkedResourceCount > 0 && (
              <span
                className="text-[10px] flex items-center gap-0.5 font-mono tabular-nums"
                title={`${task.linkedResourceCount} linked document${task.linkedResourceCount > 1 ? "s" : ""}`}
              >
                <LinkIcon className="h-3 w-3" />
                {task.linkedResourceCount}
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
};
