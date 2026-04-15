"use client";

import Link from "next/link";

import type { TaskApiError, MyTaskSummary } from "@/lib/api/tasks";
import { fullDateTime, relativeTime } from "@/lib/format";
import { SectionError } from "@/components/shared/section-error";

type DashboardTasksProps = {
  tasks: readonly MyTaskSummary[] | undefined;
  isPending: boolean;
  error: TaskApiError | null;
  onRetry: () => void;
};

type TaskViewState = "loading" | "error" | "not-ready" | "empty" | "content" | "idle";

const priorityClasses: Record<MyTaskSummary["priority"], string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-teal-500",
  low: "bg-stone-300",
};

const statusLabels: Record<MyTaskSummary["status"], string> = {
  todo: "TODO",
  in_progress: "IN PROGRESS",
  review: "REVIEW",
  done: "DONE",
};

function TaskSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex">
        <div className="w-1 bg-stone-100" />
        <div className="flex-1 p-4">
          <div className="h-4 w-40 rounded bg-stone-100" />
          <div className="mt-2 h-3 w-28 rounded bg-stone-100" />
          <div className="mt-3 h-3 w-20 rounded bg-stone-100" />
        </div>
      </div>
    </div>
  );
}

function TaskList({ tasks }: Readonly<{ tasks: readonly MyTaskSummary[] }>) {
  return (
    <div className="space-y-3">
      {tasks.slice(0, 8).map((task) => (
        <Link
          key={task.id}
          href={task.url}
          className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-stone-300 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
        >
          <div className="flex">
            <div className={`w-1.5 ${priorityClasses[task.priority]}`} aria-hidden="true" />
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{task.title}</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
                    {task.workspaceName ?? "Global"} · {statusLabels[task.status]}
                  </p>
                </div>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">
                  {task.priority}
                </span>
              </div>
              <p className="mt-3 text-xs text-stone-500" title={task.dueAt ? fullDateTime(task.dueAt) : undefined}>
                {task.dueAt ? `Due ${relativeTime(task.dueAt)}` : "No due date"}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function TaskUnavailableState({ error, onRetry }: Readonly<{ error: TaskApiError; onRetry: () => void }>) {
  return (
    <SectionError
      title="Task overview unavailable"
      message={error.message}
      requestId={error.requestId}
      onRetry={onRetry}
    />
  );
}

function TaskNotReadyState() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="font-semibold text-stone-900">Task feed arrives with the task domain</p>
      <p className="mt-2 text-sm text-stone-500">
        The dashboard is ready for cross-workspace tasks, but that API surface is not available in this environment yet.
      </p>
    </div>
  );
}

function TaskEmptyState() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="font-semibold text-stone-900">No cross-workspace tasks right now</p>
      <p className="mt-2 text-sm text-stone-500">
        New assignments and reviews will appear here as soon as task workflows are active.
      </p>
    </div>
  );
}

function getTaskViewState({
  error,
  isPending,
  tasks,
}: Readonly<Pick<DashboardTasksProps, "error" | "isPending" | "tasks">>): TaskViewState {
  const hasTaskData = Boolean(tasks);

  if (!hasTaskData) {
    if (isPending) {
      return "loading";
    }

    if (error?.kind === "not-found") {
      return "not-ready";
    }

    if (error) {
      return "error";
    }

    return "idle";
  }

  return tasks!.length > 0 ? "content" : "empty";
}

function DashboardTasksBody({
  error,
  isPending,
  onRetry,
  tasks,
}: Readonly<DashboardTasksProps>) {
  switch (getTaskViewState({ error, isPending, tasks })) {
    case "loading":
      return (
        <div className="space-y-3">
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
        </div>
      );
    case "error":
      return error ? <TaskUnavailableState error={error} onRetry={onRetry} /> : null;
    case "not-ready":
      return <TaskNotReadyState />;
    case "empty":
      return <TaskEmptyState />;
    case "content":
      return tasks ? <TaskList tasks={tasks} /> : null;
    default:
      return null;
  }
}

export function DashboardTasks(props: Readonly<DashboardTasksProps>) {
  return (
    <section aria-labelledby="dashboard-tasks-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="dashboard-tasks-heading" className="text-sm font-semibold text-stone-900">
          My tasks
        </h2>
        <Link href="/notifications" className="text-sm font-medium text-teal-600 hover:text-teal-700">
          View updates
        </Link>
      </div>
      <DashboardTasksBody {...props} />
    </section>
  );
}
