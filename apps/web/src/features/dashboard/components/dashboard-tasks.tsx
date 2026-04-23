import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionError } from "@/components/shared/section-error";
import { formatDueDate } from "@/lib/format";
import { getDashboardTasks, type DashboardTask } from "@/api/adapters/dashboard";

type Priority = DashboardTask["priority"];
type Status = DashboardTask["status"];
type Task = DashboardTask;
type State = "loading" | "loaded" | "empty" | "error";

const priorityBar: Record<Priority, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-teal-500",
  low: "bg-stone-300",
};

const statusLabel: Record<Status, string> = {
  todo: "TODO",
  in_progress: "IN PROGRESS",
  in_review: "REVIEW",
};

const statusStyles: Record<Status, string> = {
  todo: "bg-stone-100 text-stone-500",
  in_progress: "bg-teal-50 text-teal-600 border border-teal-200",
  in_review: "bg-amber-50 text-amber-600 border border-amber-200",
};

export const DashboardTasks = () => {
  const [state, setState] = useState<State>("loading");
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getDashboardTasks()
      .then((data) => {
        if (cancelled) return;
        setTasks(data);
        setState(data.length === 0 ? "empty" : "loaded");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section aria-labelledby="tasks-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="tasks-heading" className="text-sm font-semibold text-stone-900 flex items-center gap-2">
          My tasks
          {state === "loaded" && tasks.length > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-teal-50 border border-teal-200 text-[10px] font-mono font-semibold text-teal-700 flex items-center justify-center">
              {tasks.length}
            </span>
          )}
        </h2>
      </div>

      {state === "loading" && <Loading />}
      {state === "empty" && <Empty />}
      {state === "error" && (
        <SectionError sectionName="tasks" requestId="req_7c1e9d12" onRetry={() => setState("loaded")} />
      )}
      {state === "loaded" && (
        <div className="space-y-0.5">
          {tasks.slice(0, 8).map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          {tasks.length > 8 && (
            <div className="pt-2 border-t border-stone-100 mt-1">
              <Link
                to="/dashboard"
                className="text-[12px] font-medium text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
              >
                View all assigned tasks
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const TaskRow = ({ task }: { task: Task }) => {
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;
  return (
    <Link
      to="/dashboard"
      className="group flex items-stretch gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-stone-50 transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
    >
      <span className="sr-only">{task.priority} priority</span>
      <div className={cn("w-1 rounded-full flex-shrink-0", priorityBar[task.priority])} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900 truncate group-hover:text-teal-700 transition-colors duration-150">
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-[10px] text-stone-400 tracking-wider truncate">
            {task.workspaceName}
          </span>
          {due && (
            <>
              <span className="h-0.5 w-0.5 rounded-full bg-stone-300 flex-shrink-0" aria-hidden="true" />
              <span
                className={cn(
                  "text-[11px] font-medium flex items-center gap-1",
                  due.isOverdue && "text-red-600",
                  due.isDueToday && !due.isOverdue && "text-amber-600",
                  !due.isOverdue && !due.isDueToday && "text-stone-500",
                )}
              >
                {due.isOverdue && <AlertCircle className="h-3 w-3" />}
                {due.text}
              </span>
            </>
          )}
        </div>
      </div>
      <span
        className={cn(
          "text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full flex-shrink-0 self-start mt-0.5",
          statusStyles[task.status],
        )}
      >
        {statusLabel[task.status]}
      </span>
    </Link>
  );
};

const Loading = () => (
  <div className="space-y-1" aria-busy="true">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 py-3 px-3 -mx-3">
        <Skeleton className="w-1 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

const Empty = () => (
  <div className="py-8 text-center">
    <div className="h-10 w-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
      <CheckSquare className="h-5 w-5 text-stone-400" />
    </div>
    <p className="text-sm text-stone-500 mt-3">No tasks assigned to you</p>
    <p className="text-xs text-stone-400 mt-1">Tasks will appear here when your team assigns you work.</p>
  </div>
);
