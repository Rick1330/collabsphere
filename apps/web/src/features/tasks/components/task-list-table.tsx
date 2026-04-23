import { ChevronDown, ChevronsUpDown, ChevronUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDueDate,
  fullDateTime,
  getAvatarColor,
  getInitials,
  relativeTime,
} from "@/lib/format";
import type { TaskBoardItem } from "@/api/adapters/tasks";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskStatusBadge } from "./task-status-badge";

export type SortField =
  | "title"
  | "status"
  | "priority"
  | "assignee"
  | "dueDate"
  | "updatedAt"
  | "commentCount";
export type SortDirection = "asc" | "desc";

export interface TaskListRow extends TaskBoardItem {
  updatedAt: string;
}

interface TaskListTableProps {
  tasks: TaskListRow[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onTaskClick: (taskId: string) => void;
}

const SortHeader = ({
  field,
  label,
  currentSort,
  currentDir,
  onSort,
  width,
  align = "left",
}: {
  field: SortField;
  label: string;
  currentSort: SortField;
  currentDir: SortDirection;
  onSort: (field: SortField) => void;
  width: string;
  align?: "left" | "right";
}) => {
  const isActive = currentSort === field;
  const ariaSort: React.AriaAttributes["aria-sort"] = !isActive
    ? "none"
    : currentDir === "asc"
      ? "ascending"
      : "descending";
  return (
    <th
      className={cn("px-4 py-2.5", width, align === "right" ? "text-right" : "text-left")}
      scope="col"
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors duration-100",
          align === "right" && "ml-auto",
          isActive
            ? "text-stone-700"
            : "text-stone-400 hover:text-stone-600",
        )}
        aria-label={`Sort by ${label}, currently ${
          isActive ? currentDir + "ending" : "unsorted"
        }`}
      >
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-30" />
        )}
      </button>
    </th>
  );
};

export const TaskListTable = ({
  tasks,
  sortField,
  sortDirection,
  onSort,
  onTaskClick,
}: TaskListTableProps) => {
  const renderDueDate = (task: TaskListRow) => {
    if (!task.dueDate) {
      return <span className="text-stone-300">—</span>;
    }

    const due = formatDueDate(task.dueDate);
    const dueClassName = cn(
      "text-sm",
      due.isOverdue && "text-red-600 font-medium",
      due.isDueToday && "text-amber-600 font-medium",
      !due.isOverdue && !due.isDueToday && "text-stone-500",
    );

    return <span className={dueClassName}>{due.text}</span>;
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70">
              <SortHeader
                field="title"
                label="Task"
                currentSort={sortField}
                currentDir={sortDirection}
                onSort={onSort}
                width="w-[32%]"
              />
              <SortHeader
                field="status"
                label="Status"
                currentSort={sortField}
                currentDir={sortDirection}
                onSort={onSort}
                width="w-[10%]"
              />
              <SortHeader
                field="priority"
                label="Priority"
                currentSort={sortField}
                currentDir={sortDirection}
                onSort={onSort}
                width="w-[10%]"
              />
              <SortHeader
                field="assignee"
                label="Assignee"
                currentSort={sortField}
                currentDir={sortDirection}
                onSort={onSort}
                width="w-[14%]"
              />
              <SortHeader
                field="dueDate"
                label="Due"
                currentSort={sortField}
                currentDir={sortDirection}
                onSort={onSort}
                width="w-[10%]"
              />
              <SortHeader
                field="updatedAt"
                label="Updated"
                currentSort={sortField}
                currentDir={sortDirection}
                onSort={onSort}
                width="w-[10%]"
              />
              <SortHeader
                field="commentCount"
                label="Comments"
                currentSort={sortField}
                currentDir={sortDirection}
                onSort={onSort}
                width="w-[6%]"
                align="right"
              />
              <th className="text-left px-4 py-2.5 w-[8%]" scope="col">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-stone-400">
                  Labels
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTaskClick(task.id);
                  }
                }}
                tabIndex={0}
                className={cn(
                  "border-b border-stone-100 last:border-b-0",
                  "hover:bg-stone-50 transition-colors duration-100",
                  "cursor-pointer group outline-none",
                  "focus-visible:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500/40",
                )}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-0.5 h-5 rounded-full flex-shrink-0",
                        task.priority === "urgent" && "bg-red-500",
                        task.priority === "high" && "bg-amber-500",
                        task.priority === "medium" && "bg-teal-500",
                        task.priority === "low" && "bg-stone-300",
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-stone-900 truncate group-hover:text-teal-700 transition-colors duration-100">
                      {task.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="px-4 py-2.5">
                  <TaskPriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-2.5">
                  {task.assignee ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{
                          backgroundColor: getAvatarColor(task.assignee.id),
                        }}
                        aria-hidden="true"
                      >
                        {getInitials(task.assignee.fullName, 1)}
                      </div>
                      <span className="text-sm text-stone-700 truncate">
                        {task.assignee.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-stone-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {renderDueDate(task)}
                </td>
                <td className="px-4 py-2.5">
                  <time
                    dateTime={task.updatedAt}
                    title={fullDateTime(task.updatedAt)}
                    className="font-mono text-[10px] text-stone-400 tracking-wider"
                  >
                    {relativeTime(task.updatedAt)}
                  </time>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {task.commentCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-stone-500 font-mono">
                      <MessageSquare className="h-3 w-3" />
                      {task.commentCount}
                    </span>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {task.labels.length === 0 ? (
                    <span className="text-stone-300">—</span>
                  ) : (
                    <div className="flex gap-1 flex-wrap">
                      {task.labels.slice(0, 2).map((l) => (
                        <span
                          key={l}
                          className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200 truncate max-w-[80px] leading-none"
                        >
                          {l}
                        </span>
                      ))}
                      {task.labels.length > 2 && (
                        <span className="text-[9px] text-stone-400 font-mono">
                          +{task.labels.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
