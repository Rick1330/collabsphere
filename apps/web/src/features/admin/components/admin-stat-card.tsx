import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  isLoading?: boolean;
}

export const AdminStatCard = forwardRef<HTMLDivElement, AdminStatCardProps>(({
  title,
  value,
  icon: Icon,
  iconColor = "text-stone-500",
  description,
  isLoading,
}, ref) => {
  return (
    <div
      ref={ref}
      className="rounded-xl border border-stone-200 bg-white shadow-sm p-5"
      aria-busy={isLoading || undefined}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase">
          {title}
        </span>
        <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-20 rounded mt-2" />
      ) : (
        <p className="text-2xl font-bold text-stone-900 mt-2 tracking-tight">
          {value}
        </p>
      )}
      {description && (
        <p className="text-xs text-stone-400 mt-1">{description}</p>
      )}
    </div>
  );
});

AdminStatCard.displayName = "AdminStatCard";
