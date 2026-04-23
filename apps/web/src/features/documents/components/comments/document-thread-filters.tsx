import { cn } from "@/lib/utils";
import type { CommentFilter } from "@/features/documents/hooks/use-document-comments";

interface DocumentThreadFiltersProps {
  filter: CommentFilter;
  openCount: number;
  resolvedCount: number;
  onChange: (next: CommentFilter) => void;
}

export const DocumentThreadFilters = ({
  filter,
  openCount,
  resolvedCount,
  onChange,
}: DocumentThreadFiltersProps) => (
  <div
    role="tablist"
    aria-label="Filter comment threads"
    className="inline-flex items-center bg-stone-100 rounded-md p-0.5 text-[11px] font-medium"
  >
    <button
      type="button"
      role="tab"
      aria-selected={filter === "open"}
      onClick={() => onChange("open")}
      className={cn(
        "h-6 px-2.5 rounded transition-colors flex items-center gap-1.5",
        filter === "open"
          ? "bg-white text-stone-900 shadow-sm"
          : "text-stone-500 hover:text-stone-800",
      )}
    >
      Open
      <span
        className={cn(
          "text-[10px] font-mono tracking-wider px-1 rounded",
          filter === "open" ? "bg-teal-50 text-teal-700" : "bg-stone-200/70 text-stone-500",
        )}
      >
        {openCount}
      </span>
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={filter === "resolved"}
      onClick={() => onChange("resolved")}
      className={cn(
        "h-6 px-2.5 rounded transition-colors flex items-center gap-1.5",
        filter === "resolved"
          ? "bg-white text-stone-900 shadow-sm"
          : "text-stone-500 hover:text-stone-800",
      )}
    >
      Resolved
      <span
        className={cn(
          "text-[10px] font-mono tracking-wider px-1 rounded",
          filter === "resolved" ? "bg-stone-100 text-stone-700" : "bg-stone-200/70 text-stone-500",
        )}
      >
        {resolvedCount}
      </span>
    </button>
  </div>
);
