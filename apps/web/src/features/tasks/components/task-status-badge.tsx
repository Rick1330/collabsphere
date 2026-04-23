import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/api/adapters/tasks";

const STATUS_CONFIG: Record<
  TaskStatus,
  { color: string; bg: string; border: string; label: string }
> = {
  backlog: {
    color: "text-stone-400",
    bg: "bg-stone-100",
    border: "border-stone-200",
    label: "BACKLOG",
  },
  todo: {
    color: "text-stone-600",
    bg: "bg-stone-100",
    border: "border-stone-200",
    label: "TODO",
  },
  in_progress: {
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "PROGRESS",
  },
  in_review: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "REVIEW",
  },
  done: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "DONE",
  },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export const TaskStatusBadge = ({ status, className }: TaskStatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border leading-none",
        config.bg,
        config.color,
        config.border,
        className,
      )}
    >
      {config.label}
    </span>
  );
};
