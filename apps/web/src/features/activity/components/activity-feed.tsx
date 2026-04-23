import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PageHeader,
  CountChip,
  MetaStat,
  MetaDivider,
} from "@/components/shared/page-header";
import {
  fetchWorkspaceActivityPaginated,
  type ActivityEvent,
} from "@/api/adapters/activity";
import { ActivityEventItem } from "./activity-event-item";

interface ActivityFeedProps {
  workspaceId: string;
}

const PAGE_SIZE = 25;

function groupEventsByDate(events: ActivityEvent[]): Map<string, ActivityEvent[]> {
  const groups = new Map<string, ActivityEvent[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const event of events) {
    const date = new Date(event.createdAt);
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "TODAY";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "YESTERDAY";
    } else {
      key = date
        .toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        })
        .toUpperCase();
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return groups;
}

export function ActivityFeed({ workspaceId }: ActivityFeedProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["workspace", workspaceId, "activity", "full", page],
    queryFn: () =>
      fetchWorkspaceActivityPaginated(workspaceId, { page, pageSize: PAGE_SIZE }),
  });

  const events = data?.data.items ?? [];
  const pagination = data?.meta.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalCount = pagination?.totalItems;

  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);
  const distinctActors = useMemo(
    () => new Set(events.map((e) => e.actor.id)).size,
    [events],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        variant="contextual"
        eyebrow="Workspace timeline"
        title="Activity"
        description="Every change that touched this workspace, in chronological order."
        badges={
          totalCount !== undefined ? (
            <CountChip value={totalCount.toLocaleString()} tone="neutral" label="total events" />
          ) : null
        }
        meta={
          totalCount !== undefined ? (
            <>
              <MetaStat label="events on this page" value={events.length} />
              <MetaDivider />
              <MetaStat label="distinct contributors" value={distinctActors} />
              <MetaDivider />
              <MetaStat label={`page ${page} of ${totalPages}`} />
            </>
          ) : null
        }
      />

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3.5">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-3.5 w-4/5 rounded" />
                <Skeleton className="h-3 w-2/5 rounded" />
                <Skeleton className="h-2.5 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center"
        >
          <AlertCircle className="h-6 w-6 text-red-400 mx-auto" aria-hidden="true" />
          <p className="text-sm font-semibold text-stone-900 mt-3">Couldn't load activity</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 h-8 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && events.length === 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-10">
          <div className="flex items-start gap-5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-50 to-stone-50 border border-stone-200 flex items-center justify-center flex-shrink-0">
              <ActivityIcon className="h-5 w-5 text-teal-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400">
                Quiet workspace
              </p>
              <h3 className="text-base font-semibold text-stone-900 mt-1.5">
                Nothing has happened yet
              </h3>
              <p className="text-sm text-stone-500 mt-1.5 max-w-md">
                Document edits, task transitions, comments, and member changes will appear
                here as they happen — newest first, grouped by day.
              </p>
              <ul className="mt-4 space-y-1.5 text-[12px] text-stone-500">
                <li>· Document created, edited, or deleted</li>
                <li>· Task created, moved between columns, or completed</li>
                <li>· Member invited, joined, or had their role changed</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Loaded — grouped timeline */}
      {!isLoading && !isError && events.length > 0 && (
        <div className="space-y-8">
          {Array.from(groupedEvents.entries()).map(([dateLabel, dateEvents]) => (
            <section key={dateLabel}>
              <h2 className="font-mono text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-4 sticky top-0 bg-stone-50/95 backdrop-blur py-2 z-10 border-b border-stone-200/70 flex items-center gap-3">
                <span>{dateLabel}</span>
                <span className="font-mono text-[10px] text-stone-400 tabular-nums">
                  {dateEvents.length} event{dateEvents.length !== 1 ? "s" : ""}
                </span>
              </h2>
              <div>
                {dateEvents.map((event, index) => (
                  <ActivityEventItem
                    key={event.id}
                    event={event}
                    showConnector={index < dateEvents.length - 1}
                  />
                ))}
              </div>
            </section>
          ))}

          {totalPages > 1 && (
            <nav
              aria-label="Activity pagination"
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-stone-200/70"
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 px-4 rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Previous
              </button>
              <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                className="h-8 px-4 rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
