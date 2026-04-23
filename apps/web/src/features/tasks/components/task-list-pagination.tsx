import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/features/tasks/hooks/use-task-list-query-state";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export const TaskListPagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 px-1"
      aria-label="Pagination"
    >
      <div className="text-[12px] text-stone-500 font-mono tracking-wider">
        {total === 0 ? (
          <span>0 results</span>
        ) : (
          <span>
            {start}–{end} of {total}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-[12px] text-stone-500">
          <span className="font-mono uppercase tracking-wider text-[10px]">
            Per page
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 rounded-md border border-stone-200 bg-white px-2 text-[12px] text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
            aria-label="Results per page"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className={cn(
              "h-7 w-7 rounded-md border flex items-center justify-center transition-colors",
              page <= 1
                ? "bg-stone-50 border-stone-200 text-stone-300 cursor-not-allowed"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50",
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[12px] text-stone-600 font-mono tracking-wider px-2">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
            className={cn(
              "h-7 w-7 rounded-md border flex items-center justify-center transition-colors",
              page >= pageCount
                ? "bg-stone-50 border-stone-200 text-stone-300 cursor-not-allowed"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50",
            )}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
