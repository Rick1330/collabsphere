import { Link } from "react-router-dom";
import {
  KanbanSquare,
  ListFilter,
  Plus,
  Search,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TaskAdvancedFilters,
  ActiveFilterPills,
  type AdvancedFilterState,
} from "./task-advanced-filters";
import type { TaskAssignee } from "@/api/adapters/tasks";
import type { RealtimeStatus } from "@/features/tasks/hooks/use-task-realtime";

interface TaskPageHeaderProps {
  workspaceId: string;
  activeView: "board" | "list";
  totalTaskCount: number | undefined;
  visibleTaskCount?: number;
  search: string;
  onSearchChange: (v: string) => void;
  filters: AdvancedFilterState;
  onFiltersChange: (next: AdvancedFilterState) => void;
  members: TaskAssignee[];
  allLabels: string[];
  canCreate: boolean;
  onCreateTask?: () => void;
  realtime: RealtimeStatus;
}

/**
 * Task page header — refined for the operational identity these surfaces
 * deserve. Two visual systems composed deliberately:
 *
 *  - Eyebrow + title rail with the count chip and live indicator so the
 *    page identifies as "Tasks" before any other affordance.
 *  - Toolbar rail that holds view switcher (segmented), search, filters,
 *    and the primary action — kept in one tight row on desktop, stacked
 *    on mobile.
 *
 * The hairline divider underneath separates the header from the filter
 * pills + content, giving the page a real header structure rather than
 * a single floating row.
 */
export const TaskPageHeader = ({
  workspaceId,
  activeView,
  totalTaskCount,
  visibleTaskCount,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  members,
  allLabels,
  canCreate,
  onCreateTask,
  realtime,
}: TaskPageHeaderProps) => {
  const segBase =
    "h-7 px-2.5 text-[11px] font-medium border flex items-center gap-1.5 transition-colors";
  const segActive = "bg-stone-900 text-white border-stone-900";
  const segIdle =
    "bg-white text-stone-500 border-stone-200 hover:text-stone-800 hover:bg-stone-50";

  return (
    <div className="mb-4 pb-3 border-b border-stone-200/70">
      {/* Title rail */}
      <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
        <div className="min-w-0">
          <span className="font-mono text-[10px] text-stone-400 tracking-[0.22em] uppercase block mb-1">
            Operational
          </span>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight leading-none">
              Tasks
            </h1>
            {totalTaskCount !== undefined && (
              <span
                className="font-mono text-[11px] text-stone-500 tracking-wider bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full tabular-nums"
                aria-label={`${totalTaskCount} total tasks`}
              >
                {visibleTaskCount !== undefined &&
                visibleTaskCount !== totalTaskCount
                  ? `${visibleTaskCount} / ${totalTaskCount}`
                  : totalTaskCount}
              </span>
            )}
            <RealtimeChip status={realtime} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented view switcher */}
          <div
            className="inline-flex rounded-md overflow-hidden border border-stone-200"
            role="group"
            aria-label="View"
          >
            {activeView === "board" ? (
              <span
                className={cn(segBase, segActive, "border-r-0 rounded-l-md")}
                aria-current="page"
              >
                <KanbanSquare className="h-3.5 w-3.5" />
                Board
              </span>
            ) : (
              <Link
                to={`/w/${workspaceId}/tasks`}
                className={cn(segBase, segIdle, "border-r-0 rounded-l-md")}
              >
                <KanbanSquare className="h-3.5 w-3.5" />
                Board
              </Link>
            )}
            {activeView === "list" ? (
              <span
                className={cn(segBase, segActive, "rounded-r-md")}
                aria-current="page"
              >
                <ListFilter className="h-3.5 w-3.5" />
                List
              </span>
            ) : (
              <Link
                to={`/w/${workspaceId}/tasks/list`}
                className={cn(segBase, segIdle, "rounded-r-md")}
              >
                <ListFilter className="h-3.5 w-3.5" />
                List
              </Link>
            )}
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks…"
              aria-label="Search tasks"
              className="h-8 w-44 sm:w-56 pl-8 pr-2.5 rounded-lg border border-stone-200 bg-white text-[12px] text-stone-700 placeholder:text-stone-400 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all"
            />
          </div>

          <TaskAdvancedFilters
            value={filters}
            onChange={onFiltersChange}
            members={members}
            allLabels={allLabels}
            showStatus={activeView === "list"}
          />

          {canCreate && (
            <button
              type="button"
              onClick={onCreateTask}
              className="h-8 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-[12px] font-medium text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New task</span>
            </button>
          )}
        </div>
      </div>

      <ActiveFilterPills
        value={filters}
        onChange={onFiltersChange}
        members={members}
      />
    </div>
  );
};

const RealtimeChip = ({ status }: { status: RealtimeStatus }) => {
  if (status === "connected") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"
        title="Live updates connected"
      >
        <Wifi className="h-3 w-3" /> Live
      </span>
    );
  }
  if (status === "reconnecting") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"
        title="Reconnecting to live updates"
      >
        <Loader2 className="h-3 w-3 animate-spin" /> Reconnecting
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-stone-500 bg-stone-100 border border-stone-200 rounded-full px-2 py-0.5"
      title="Live updates unavailable, polling for changes"
    >
      <WifiOff className="h-3 w-3" /> Polling
    </span>
  );
};
