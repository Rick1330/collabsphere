import { AlertTriangle, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/api/adapters/tasks";

const PRIORITY_CONFIG = {
  urgent: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Urgent",
  },
  high: {
    icon: ArrowUp,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "High",
  },
  medium: {
    icon: Minus,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "Medium",
  },
  low: {
    icon: ArrowDown,
    color: "text-stone-500",
    bg: "bg-stone-100",
    border: "border-stone-200",
    label: "Low",
  },
} as const;

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export const TaskPriorityBadge = ({ priority, className }: TaskPriorityBadgeProps) => {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border leading-none",
        config.bg,
        config.color,
        config.border,
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
};
