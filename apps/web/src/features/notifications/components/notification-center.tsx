import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  CountChip,
  MetaStat,
  MetaDivider,
} from "@/components/shared/page-header";
import {
  fetchNotificationCategoryCounts,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_CATEGORY_META,
  type Notification,
  type NotificationCategory,
  type NotificationPage,
} from "@/api/adapters/notifications";
import { NotificationItem } from "./notification-item";

const PAGE_SIZE = 20;

type Filter = "all" | "unread";
type CategoryFilter = "all" | NotificationCategory;

const CATEGORIES: Array<{ key: CategoryFilter; label: string }> = [
  { key: "all", label: "Everything" },
  { key: "tasks", label: NOTIFICATION_CATEGORY_META.tasks.label },
  { key: "documents", label: NOTIFICATION_CATEGORY_META.documents.label },
  { key: "comments", label: NOTIFICATION_CATEGORY_META.comments.label },
  { key: "workspace", label: NOTIFICATION_CATEGORY_META.workspace.label },
  { key: "deadlines", label: NOTIFICATION_CATEGORY_META.deadlines.label },
];

function groupByDay(items: Notification[]): Map<string, Notification[]> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const groups = new Map<string, Notification[]>();
  for (const n of items) {
    const d = new Date(n.createdAt);
    let key: string;
    if (d.toDateString() === today.toDateString()) key = "TODAY";
    else if (d.toDateString() === yesterday.toDateString()) key = "YESTERDAY";
    else
      key = d
        .toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        })
        .toUpperCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }
  return groups;
}

export const NotificationCenter = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [filter, category]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications", filter, category, page],
    queryFn: () =>
      fetchNotifications({
        page,
        pageSize: PAGE_SIZE,
        unreadOnly: filter === "unread",
        category,
      }),
  });

  const { data: unreadCount, refetch: refetchUnread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    select: (r) => r.data.unreadCount,
  });

  const { data: categoryCounts } = useQuery({
    queryKey: ["notifications", "category-counts", filter],
    queryFn: () => fetchNotificationCategoryCounts(filter === "unread"),
    select: (r) => r.data,
  });

  const notifications = data?.data.items ?? [];
  const totalPages = data?.meta?.pagination?.totalPages ?? 1;
  const totalItems = data?.meta?.pagination?.totalItems ?? 0;

  const grouped = useMemo(() => groupByDay(notifications), [notifications]);

  const handleMarkRead = async (notificationId: string) => {
    queryClient.setQueryData<NotificationPage | undefined>(
      ["notifications", filter, category, page],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.map((n) =>
              n.id === notificationId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n,
            ),
          },
        };
      },
    );
    try {
      await markNotificationRead(notificationId);
      refetchUnread();
      queryClient.invalidateQueries({
        queryKey: ["notifications", "category-counts"],
      });
    } catch {
      // navigation still proceeds
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      const result = await markAllNotificationsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const count = result.data.updatedCount;
      toast.success(`${count} notification${count !== 1 ? "s" : ""} marked as read`);
    } catch {
      toast.error("Failed to mark all as read.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  // ── render
  const headerActions = (
    <>
      <div
        aria-label="Read filter"
        className="flex items-center rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden"
      >
        {(["all", "unread"] as Filter[]).map((key) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={cn(
                "h-8 px-3 text-[12px] font-medium transition-colors",
                active
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-50",
              )}
            >
              {key === "all" ? "All" : "Unread"}
            </button>
          );
        })}
      </div>
      {!!unreadCount && unreadCount > 0 && (
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={isMarkingAll}
          className="h-8 px-3 rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {isMarkingAll ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Marking…
            </>
          ) : (
            <>
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </>
          )}
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        variant="index"
        eyebrow="Inbox"
        title="Notifications"
        description="Mentions, assignments, and updates from every workspace you belong to."
        badges={
          unreadCount !== undefined && unreadCount > 0 ? (
            <CountChip
              tone="teal"
              value={`${unreadCount} unread`}
              label={`${unreadCount} unread notifications`}
            />
          ) : null
        }
        actions={headerActions}
        meta={
          <>
            <MetaStat label="in this view" value={totalItems} />
            <MetaDivider />
            <MetaStat
              label={filter === "unread" ? "showing unread only" : "showing all"}
            />
            {category !== "all" && (
              <>
                <MetaDivider />
                <MetaStat
                  label="filtered by"
                  value={NOTIFICATION_CATEGORY_META[category].label}
                />
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        {/* Category rail */}
        <aside aria-label="Notification categories" className="lg:sticky lg:top-4 self-start">
          <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-3">
            Type
          </h2>
          <ul className="flex lg:block gap-1.5 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:pb-0">
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              const count =
                c.key === "all"
                  ? categoryCounts?.all ?? 0
                  : categoryCounts?.byCategory[c.key as NotificationCategory] ?? 0;
              return (
                <li key={c.key} className="flex-shrink-0 lg:flex-shrink">
                  <button
                    type="button"
                    onClick={() => setCategory(c.key)}
                    aria-pressed={active}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors",
                      "border lg:border-transparent",
                      active
                        ? "bg-white border-stone-200 text-stone-900 font-semibold shadow-sm"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 border-stone-200 lg:border-transparent",
                    )}
                  >
                    <span className="truncate">{c.label}</span>
                    <span
                      className={cn(
                        "font-mono text-[10px] tabular-nums tracking-wider px-1.5 py-0.5 rounded",
                        active
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-500",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Stream */}
        <div>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {getNotificationStatusMessage(isLoading, notifications.length, filter)}
          </div>

          {/* Loading */}
          {isLoading && (
            <div
              aria-busy="true"
              className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden divide-y divide-stone-100"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5 rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50/40 p-8 text-center"
            >
              <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-900 mt-3">
                Couldn't load notifications
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 h-8 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </button>
            </div>
          )}

          {/* Empty — caught up */}
          {!isLoading && !isError && notifications.length === 0 && filter === "all" && (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 sm:p-12 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-50 to-stone-50 border border-stone-200 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-6 w-6 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400">
                    Nothing waiting
                  </p>
                  <h3 className="text-base font-semibold text-stone-900 mt-1.5">
                    You're all caught up
                  </h3>
                  <p className="text-sm text-stone-500 mt-1.5 max-w-md">
                    New mentions, task assignments, and document updates will land here
                    the moment your team takes action.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty — unread */}
          {!isLoading && !isError && notifications.length === 0 && filter === "unread" && (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 shadow-sm text-center">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto">
                <CheckCheck className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 mt-4">
                Inbox zero on unread
              </h3>
              <p className="text-sm text-stone-500 mt-1.5 max-w-sm mx-auto">
                You've read everything new. Switch to "All" to revisit your history.
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-4 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
              >
                Show all notifications →
              </button>
            </div>
          )}

          {/* Loaded — grouped by day */}
          {!isLoading && !isError && notifications.length > 0 && (
            <>
              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                {Array.from(grouped.entries()).map(([dayLabel, dayItems], gi) => (
                  <section key={dayLabel} aria-label={dayLabel}>
                    <header
                      className={cn(
                        "px-5 py-2 bg-stone-50/80 border-b border-stone-100 flex items-center gap-3",
                        gi !== 0 && "border-t border-stone-100",
                      )}
                    >
                      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-500">
                        {dayLabel}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400 tabular-nums">
                        {dayItems.length}
                      </span>
                    </header>
                    <ul className="divide-y divide-stone-100">
                      {dayItems.map((n) => (
                        <li key={n.id}>
                          <NotificationItem
                            notification={n}
                            onMarkRead={handleMarkRead}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Notification pagination"
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-5"
                >
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 px-4 rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 px-4 rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
};

function getNotificationStatusMessage(
  isLoading: boolean,
  notificationCount: number,
  filter: Filter,
) {
  if (isLoading) return "Loading notifications...";
  if (notificationCount === 0) {
    return filter === "unread" ? "No unread notifications" : "No notifications";
  }
  return `${notificationCount} notifications shown`;
}
