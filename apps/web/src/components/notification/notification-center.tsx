"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { Button } from "@collabsphere/ui/components/button";
import { cn } from "@collabsphere/ui/lib/utils";

import {
  listRecentNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationUnreadCountQueryKey,
  recentNotificationsQueryKey,
  readNotificationUnreadCount,
  type NotificationSummary,
  NotificationApiError,
} from "@/lib/api/notifications";
import { fullDateTime, relativeTime } from "@/lib/format";
import { SectionError } from "@/components/shared/section-error";

type NotificationItem = NotificationSummary;

type NotificationFeedState = "loading" | "error" | "empty" | "content";

type NotificationCenterMutationContext = {
  notifications: readonly NotificationItem[] | undefined;
  unreadCount: number | undefined;
};

const cancelNotificationCenterQueries = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: recentNotificationsQueryKey }),
    queryClient.cancelQueries({ queryKey: notificationUnreadCountQueryKey }),
  ]);
};

const captureNotificationCenterMutationContext = (
  queryClient: QueryClient,
): NotificationCenterMutationContext => ({
  notifications: queryClient.getQueryData<readonly NotificationItem[]>(recentNotificationsQueryKey),
  unreadCount: queryClient.getQueryData<number>(notificationUnreadCountQueryKey),
});

const restoreNotificationCenterMutationContext = (
  queryClient: QueryClient,
  context: NotificationCenterMutationContext | undefined,
) => {
  if (!context) {
    return;
  }

  queryClient.setQueryData(recentNotificationsQueryKey, context.notifications);
  queryClient.setQueryData(notificationUnreadCountQueryKey, context.unreadCount);
};

const invalidateNotificationCenterQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: recentNotificationsQueryKey }).catch(() => undefined);
  queryClient.invalidateQueries({ queryKey: notificationUnreadCountQueryKey }).catch(() => undefined);
};

const optimisticallyMarkAllNotificationsAsRead = (queryClient: QueryClient) => {
  queryClient.setQueryData<readonly NotificationItem[] | undefined>(
    recentNotificationsQueryKey,
    (current) => current?.map((notification) => ({ ...notification, isRead: true })),
  );
  queryClient.setQueryData(notificationUnreadCountQueryKey, 0);
};

const optimisticallyMarkNotificationAsRead = (queryClient: QueryClient, notificationId: string) => {
  let unreadMarked = false;

  queryClient.setQueryData<readonly NotificationItem[] | undefined>(
    recentNotificationsQueryKey,
    (current) =>
      current?.map((notification) => {
        if (notification.id !== notificationId || notification.isRead) {
          return notification;
        }

        unreadMarked = true;
        return { ...notification, isRead: true };
      }),
  );

  queryClient.setQueryData<number | undefined>(
    notificationUnreadCountQueryKey,
    (current) => (unreadMarked && typeof current === "number" && current > 0 ? current - 1 : current),
  );
};

const createNotificationMutationLifecycle = <TVariables,>(
  queryClient: QueryClient,
  applyOptimisticUpdate: (queryClient: QueryClient, variables: TVariables) => void,
) => ({
  onMutate: async (variables: TVariables): Promise<NotificationCenterMutationContext> => {
    await cancelNotificationCenterQueries(queryClient);
    const context = captureNotificationCenterMutationContext(queryClient);
    applyOptimisticUpdate(queryClient, variables);
    return context;
  },
  onError: (_error: unknown, _variables: TVariables, context: NotificationCenterMutationContext | undefined) => {
    restoreNotificationCenterMutationContext(queryClient, context);
  },
  onSuccess: () => {
    invalidateNotificationCenterQueries(queryClient);
  },
  onSettled: () => {
    invalidateNotificationCenterQueries(queryClient);
  },
});

function NotificationSkeletonList() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="border-b border-stone-100 p-5 last:border-b-0">
          <div className="h-4 w-44 rounded bg-stone-100" />
          <div className="mt-2 h-3 w-80 rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

function NotificationEmptyState({ filter }: Readonly<{ filter: "all" | "unread" }>) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
      <p className="text-lg font-semibold text-stone-900">
        {filter === "all" ? "You’re all caught up" : "No unread notifications"}
      </p>
      <p className="mt-2 text-sm text-stone-500">
        {filter === "all"
          ? "New mentions, assignments, and workspace events will appear here."
          : "Everything currently in your feed has already been read."}
      </p>
    </div>
  );
}

function getNotificationFeedState({
  error,
  filteredNotifications,
  hasData,
  isPending,
}: Readonly<{
  error: NotificationApiError | null;
  filteredNotifications: readonly NotificationItem[];
  hasData: boolean;
  isPending: boolean;
}>): NotificationFeedState {
  if (isPending) {
    return "loading";
  }

  if (error && !hasData) {
    return "error";
  }

  if (filteredNotifications.length === 0) {
    return "empty";
  }

  return "content";
}

function NotificationFeedItem({
  notification,
  onMarkOne,
}: Readonly<{
  notification: NotificationItem;
  onMarkOne: (notificationId: string) => void;
}>) {
  return (
    <Link
      href={notification.url}
      className={cn(
        "grid gap-3 border-b border-stone-100 p-5 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500/40 last:border-b-0 md:grid-cols-[auto_1fr_auto]",
        !notification.isRead && "bg-teal-50/30",
      )}
      onClick={() => {
        if (!notification.isRead) {
          onMarkOne(notification.id);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-1 inline-flex h-2 w-2 rounded-full",
            notification.isRead ? "bg-transparent" : "bg-teal-500",
          )}
          aria-hidden="true"
        />
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-stone-50 font-mono text-xs text-stone-500">
          {notification.type.slice(0, 2).toUpperCase()}
        </div>
      </div>
      <div className="min-w-0">
        <p className={cn("text-sm text-stone-700", !notification.isRead && "font-semibold text-stone-900")}>
          {notification.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-stone-500">{notification.body}</p>
        {notification.workspaceId ? (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
            {notification.workspaceId}
          </p>
        ) : null}
      </div>
      <time
        dateTime={notification.createdAt}
        title={fullDateTime(notification.createdAt)}
        className="font-mono text-[11px] text-stone-400"
      >
        {relativeTime(notification.createdAt)}
      </time>
    </Link>
  );
}

function NotificationCenterHeader({
  filter,
  isMarkAllPending,
  onFilterChange,
  onMarkAll,
  unreadCount,
}: Readonly<{
  filter: "all" | "unread";
  unreadCount: number;
  isMarkAllPending: boolean;
  onFilterChange: (value: "all" | "unread") => void;
  onMarkAll: () => void;
}>) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-stone-900">
            Notifications
            <span className="rounded-full bg-teal-600 px-2.5 py-1 font-mono text-[11px] text-white">
              {unreadCount}
            </span>
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Follow mentions, assignments, and workspace movement from one feed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
            {(["all", "unread"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => onFilterChange(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  filter === value ? "bg-teal-600 text-white" : "text-stone-500 hover:text-stone-900",
                )}
              >
                {value === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
          {unreadCount > 0 ? (
            <Button size="sm" variant="secondary" disabled={isMarkAllPending} onClick={onMarkAll}>
              {isMarkAllPending ? "Marking..." : "Mark all read"}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function NotificationFeed({
  error,
  filter,
  filteredNotifications,
  hasData,
  isPending,
  onMarkOne,
  onRetry,
}: Readonly<{
  error: NotificationApiError | null;
  filter: "all" | "unread";
  filteredNotifications: readonly NotificationItem[];
  hasData: boolean;
  isPending: boolean;
  onMarkOne: (notificationId: string) => void;
  onRetry: () => void;
}>) {
  switch (getNotificationFeedState({ error, filteredNotifications, hasData, isPending })) {
    case "loading":
      return <NotificationSkeletonList />;
    case "error":
      return error ? (
        <SectionError
          title="Notifications couldn’t be loaded"
          message={error.message}
          requestId={error.requestId}
          onRetry={onRetry}
        />
      ) : null;
    case "empty":
      return <NotificationEmptyState filter={filter} />;
    default:
      break;
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
      {filteredNotifications.map((notification) => (
        <NotificationFeedItem
          key={notification.id}
          notification={notification}
          onMarkOne={onMarkOne}
        />
      ))}
    </div>
  );
}

export function NotificationCenter() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notificationsQuery = useQuery({
    queryKey: recentNotificationsQueryKey,
    queryFn: ({ signal }) => listRecentNotifications({ signal }),
    retry: false,
    staleTime: 30_000,
  });
  const unreadQuery = useQuery({
    queryKey: notificationUnreadCountQueryKey,
    queryFn: ({ signal }) => readNotificationUnreadCount({ signal }),
    retry: false,
    staleTime: 30_000,
  });
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = typeof unreadQuery.data === "number" ? unreadQuery.data : 0;
  const filteredNotifications = useMemo(
    () => notifications.filter((item) => (filter === "all" ? true : !item.isRead)),
    [filter, notifications],
  );
  const notificationMutationLifecycle = createNotificationMutationLifecycle(
    queryClient,
    (client, notificationId: string) => {
      optimisticallyMarkNotificationAsRead(client, notificationId);
    },
  );
  const markAllMutationLifecycle = createNotificationMutationLifecycle<void>(queryClient, (client) => {
    optimisticallyMarkAllNotificationsAsRead(client);
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    ...markAllMutationLifecycle,
  });

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    ...notificationMutationLifecycle,
  });

  const error = notificationsQuery.error instanceof NotificationApiError ? notificationsQuery.error : null;

  return (
    <div className="space-y-6">
      <NotificationCenterHeader
        filter={filter}
        isMarkAllPending={markAllMutation.isPending}
        onFilterChange={setFilter}
        onMarkAll={() => {
          markAllMutation.mutate();
        }}
        unreadCount={unreadCount}
      />

      <NotificationFeed
        error={error}
        filter={filter}
        filteredNotifications={filteredNotifications}
        hasData={Boolean(notificationsQuery.data)}
        isPending={notificationsQuery.isPending && !notificationsQuery.data}
        onMarkOne={(notificationId) => {
          markOneMutation.mutate(notificationId);
        }}
        onRetry={() => {
          notificationsQuery.refetch().catch(() => undefined);
        }}
      />
    </div>
  );
}
