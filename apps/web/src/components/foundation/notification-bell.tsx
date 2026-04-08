"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  default as React,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  NotificationApiError,
  listRecentNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationUnreadCountQueryKey,
  recentNotificationsQueryKey,
  readNotificationUnreadCount,
  type NotificationSummary,
} from "../../lib/api/notifications";

export type NotificationBellDataState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string; requestId: string | null }
  | { kind: "loaded"; notifications: NotificationSummary[] };

type NotificationAction =
  | {
      kind: "notification";
      key: string;
      notification: NotificationSummary;
    }
  | {
      kind: "retry";
      key: "action:retry";
      label: string;
      description: string;
    }
  | {
      kind: "mark-all";
      key: "action:mark-all";
      label: string;
      description: string;
    }
  | {
      kind: "view-all";
      key: "action:view-all";
      label: string;
      description: string;
    };

export type NotificationBellMenuProps = {
  dataState: NotificationBellDataState;
  initialOpen?: boolean;
  onMarkAllAsRead?: () => void;
  onRetry?: () => void;
  onSelectNotification?: (notification: NotificationSummary) => void;
  onViewAll?: () => void;
  unreadCount: number | null;
};

type NotificationBellProps = {
  initialOpen?: boolean;
  stateOverride?: NotificationBellDataState;
  unreadCountOverride?: number | null;
};

type NotificationMenuOpenKey = "Enter" | " " | "ArrowDown" | "ArrowUp";
type NotificationMenuNavigationKey =
  | "ArrowDown"
  | "ArrowUp"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown";

const notificationMenuNavigationKeys = new Set<NotificationMenuNavigationKey>([
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

const getDefaultActiveIndex = () => 0;

export const isNotificationMenuOpenKey = (key: string): key is NotificationMenuOpenKey =>
  key === "Enter" || key === " " || key === "ArrowDown" || key === "ArrowUp";

export const isNotificationMenuNavigationKey = (
  key: string,
): key is NotificationMenuNavigationKey =>
  notificationMenuNavigationKeys.has(key as NotificationMenuNavigationKey);

export const getClampedNotificationMenuIndex = (currentIndex: number, itemCount: number) => {
  if (itemCount <= 0) {
    return -1;
  }

  if (currentIndex < 0) {
    return 0;
  }

  if (currentIndex >= itemCount) {
    return itemCount - 1;
  }

  return currentIndex;
};

export const getNotificationMenuNextIndex = (
  currentIndex: number,
  key: NotificationMenuNavigationKey,
  itemCount: number,
) => {
  if (itemCount <= 0) {
    return -1;
  }

  if (key === "Home" || key === "PageUp") {
    return 0;
  }

  if (key === "End" || key === "PageDown") {
    return itemCount - 1;
  }

  if (key === "ArrowUp") {
    return currentIndex <= 0 ? itemCount - 1 : currentIndex - 1;
  }

  return currentIndex >= itemCount - 1 ? 0 : currentIndex + 1;
};

export const getNotificationMenuOpenIndex = (
  key: NotificationMenuOpenKey,
  itemCount: number,
) => {
  if (itemCount <= 0) {
    return -1;
  }

  return key === "ArrowUp" ? itemCount - 1 : 0;
};

export const formatNotificationBadgeCount = (unreadCount: number | null) => {
  if (unreadCount == null || unreadCount <= 0) {
    return null;
  }

  return unreadCount >= 100 ? "99+" : String(unreadCount);
};

export const formatNotificationRelativeTimestamp = (
  createdAt: string,
  now = Date.now(),
) => {
  const createdTimestamp = Date.parse(createdAt);

  if (Number.isNaN(createdTimestamp)) {
    return "Recently";
  }

  const delta = Math.max(0, now - createdTimestamp);
  const minutes = Math.floor(delta / 60_000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(createdTimestamp));
};

export const getNotificationTypeMark = (type: string) => {
  if (type.startsWith("task.")) {
    return "TK";
  }

  if (type.startsWith("document.")) {
    return "DC";
  }

  if (type.startsWith("workspace.")) {
    return "WS";
  }

  if (type.includes("mention")) {
    return "@";
  }

  return "NT";
};

export const getNotificationBodyPreview = (body: string, maxLength = 84) => {
  if (body.length <= maxLength) {
    return body;
  }

  return `${body.slice(0, maxLength - 1).trimEnd()}…`;
};

export const getNotificationBellDataState = ({
  error,
  notifications,
  pending,
}: {
  error: NotificationApiError | null;
  notifications: NotificationSummary[] | undefined;
  pending: boolean;
}): NotificationBellDataState => {
  const hasNotificationData = Array.isArray(notifications);

  if (pending && !hasNotificationData) {
    return { kind: "loading" };
  }

  if (hasNotificationData) {
    if (notifications.length === 0) {
      return { kind: "empty" };
    }

    return { kind: "loaded", notifications };
  }

  if (error) {
    return {
      kind: "error",
      message: error.message,
      requestId: error.requestId,
    };
  }

  return { kind: "empty" };
};

const coerceNotificationQueryError = (error: unknown) => {
  if (error instanceof NotificationApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new NotificationApiError("unknown", "Failed to load notifications.");
  }

  return null;
};

const getNotificationBellActions = (
  dataState: NotificationBellDataState,
  unreadCount: number | null,
): NotificationAction[] => {
  const actions: NotificationAction[] = [];

  if (dataState.kind === "loaded") {
    actions.push(
      ...dataState.notifications.map((notification) => ({
        kind: "notification" as const,
        key: `notification:${notification.id}`,
        notification,
      })),
    );
  }

  if (dataState.kind === "error") {
    actions.push({
      kind: "retry",
      key: "action:retry",
      label: "Retry notifications",
      description: "Reload the notification feed without leaving this page.",
    });
  }

  if (dataState.kind === "loaded" && unreadCount != null && unreadCount > 0) {
    actions.push({
      kind: "mark-all",
      key: "action:mark-all",
      label: "Mark all as read",
      description: "Clear the unread badge across your recent notifications.",
    });
  }

  actions.push({
    kind: "view-all",
    key: "action:view-all",
    label: "View all notifications",
    description: "Open the full notifications center.",
  });

  return actions;
};

const LoadingNotificationSkeleton = () => (
  <div className="notification-bell__skeleton-list" aria-hidden="true">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={`notification-skeleton-${index}`} className="notification-bell__skeleton-row">
        <span className="notification-bell__skeleton-mark" />
        <span className="notification-bell__skeleton-copy">
          <span className="notification-bell__skeleton-line notification-bell__skeleton-line--primary" />
          <span className="notification-bell__skeleton-line notification-bell__skeleton-line--secondary" />
        </span>
      </div>
    ))}
  </div>
);

export function NotificationBellMenu({
  dataState,
  initialOpen = false,
  onMarkAllAsRead,
  onRetry,
  onSelectNotification,
  onViewAll,
  unreadCount,
}: NotificationBellMenuProps) {
  const menuId = useId();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const actions = getNotificationBellActions(dataState, unreadCount);
  const [activeIndex, setActiveIndex] = useState(getDefaultActiveIndex);
  const badgeLabel =
    unreadCount != null && unreadCount > 0 ? `${unreadCount} unread notifications` : null;
  const badgeCount = formatNotificationBadgeCount(unreadCount);

  useEffect(() => {
    setActiveIndex((currentIndex) => {
      const nextIndex = getClampedNotificationMenuIndex(currentIndex, actions.length);
      return nextIndex === currentIndex ? currentIndex : nextIndex;
    });
  }, [actions.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const openMenu = (nextIndex = getDefaultActiveIndex()) => {
    setActiveIndex(getClampedNotificationMenuIndex(nextIndex, actions.length));
    setIsOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!isNotificationMenuOpenKey(event.key)) {
      return;
    }

    event.preventDefault();
    openMenu(getNotificationMenuOpenIndex(event.key, actions.length));
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (!isNotificationMenuNavigationKey(event.key)) {
      return;
    }

    event.preventDefault();
    setActiveIndex(getNotificationMenuNextIndex(activeIndex, event.key, actions.length));
  };

  const handleActionSelect = (action: NotificationAction) => {
    if (action.kind === "notification") {
      onSelectNotification?.(action.notification);
      closeMenu(true);
      return;
    }

    if (action.kind === "retry") {
      onRetry?.();
      closeMenu(true);
      return;
    }

    if (action.kind === "mark-all") {
      onMarkAllAsRead?.();
      closeMenu(true);
      return;
    }

    onViewAll?.();
    closeMenu(true);
  };

  const handleActionPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }

    setActiveIndex(index);
  };

  return (
    <div ref={rootRef} className="notification-bell">
      <button
        ref={triggerRef}
        id={`${menuId}-trigger`}
        type="button"
        className="notification-bell__trigger"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Notifications"
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }

          openMenu();
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="notification-bell__mark" aria-hidden="true">
          NT
        </span>
        <span className="notification-bell__copy">
          <span className="notification-bell__label">Notifications</span>
          <span className="notification-bell__meta">
            {badgeCount ? `${badgeCount} unread in your recent feed` : "Recent workspace updates"}
          </span>
        </span>
        {badgeCount ? (
          <span className="notification-bell__badge" aria-label={badgeLabel ?? undefined}>
            {badgeCount}
          </span>
        ) : (
          <span
            className="notification-bell__badge notification-bell__badge--empty"
            aria-hidden="true"
          >
            Clear
          </span>
        )}
      </button>

      {isOpen ? (
        <div id={menuId} className="notification-bell__panel">
          <div className="notification-bell__panel-header">
            <p className="notification-bell__panel-eyebrow">Notification center</p>
            <p className="notification-bell__panel-title">
              {badgeCount ? `${badgeCount} unread notifications` : "Recent notifications"}
            </p>
          </div>

          {dataState.kind === "loading" ? (
            <div
              className="notification-bell__state notification-bell__state--loading"
              role="status"
              aria-live="polite"
            >
              <LoadingNotificationSkeleton />
              <p className="notification-bell__state-copy">Loading recent notifications.</p>
            </div>
          ) : null}

          {dataState.kind === "empty" ? (
            <div
              className="notification-bell__state notification-bell__state--empty"
              role="status"
              aria-live="polite"
            >
              <strong className="notification-bell__state-title">You&apos;re all caught up!</strong>
              <p className="notification-bell__state-copy">
                New mentions, task activity, and workspace updates will appear here.
              </p>
            </div>
          ) : null}

          {dataState.kind === "error" ? (
            <div
              className="notification-bell__state notification-bell__state--error"
              role="status"
              aria-live="polite"
            >
              <strong className="notification-bell__state-title">Failed to load notifications</strong>
              <p className="notification-bell__state-copy">{dataState.message}</p>
              {dataState.requestId ? (
                <p className="notification-bell__state-meta">Request ID: {dataState.requestId}</p>
              ) : null}
            </div>
          ) : null}

          <div
            className="notification-bell__menu"
            role="menu"
            aria-labelledby={`${menuId}-trigger`}
            onKeyDown={handleMenuKeyDown}
          >
            {actions.map((action, index) => (
              <button
                key={action.key}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                tabIndex={index === activeIndex ? 0 : -1}
                className="notification-bell__item"
                data-kind={action.kind}
                onClick={() => {
                  handleActionSelect(action);
                }}
                onFocus={() => {
                  setActiveIndex(index);
                }}
                onPointerMove={(event) => {
                  handleActionPointerMove(event, index);
                }}
                aria-label={
                  action.kind === "notification"
                    ? `${action.notification.title}, ${
                        action.notification.isRead ? "read" : "unread"
                      } notification`
                    : action.label
                }
              >
                {action.kind === "notification" ? (
                  <>
                    <span className="notification-bell__item-mark" aria-hidden="true">
                      {getNotificationTypeMark(action.notification.type)}
                    </span>
                    <span className="notification-bell__item-copy">
                      <span className="notification-bell__item-label-row">
                        <span className="notification-bell__item-label">
                          {action.notification.title}
                        </span>
                        {!action.notification.isRead ? (
                          <span className="notification-bell__item-dot" aria-hidden="true" />
                        ) : null}
                      </span>
                      <span className="notification-bell__item-description">
                        {getNotificationBodyPreview(action.notification.body)}
                      </span>
                    </span>
                    <span className="notification-bell__item-meta">
                      {formatNotificationRelativeTimestamp(action.notification.createdAt)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="notification-bell__item-mark" aria-hidden="true">
                      {action.kind === "mark-all" ? "✓" : action.kind === "retry" ? "↺" : "→"}
                    </span>
                    <span className="notification-bell__item-copy">
                      <span className="notification-bell__item-label">{action.label}</span>
                      <span className="notification-bell__item-description">
                        {action.description}
                      </span>
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function NotificationBell({
  initialOpen = false,
  stateOverride,
  unreadCountOverride,
}: NotificationBellProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const unreadCountQuery = useQuery({
    queryKey: notificationUnreadCountQueryKey,
    queryFn: ({ signal }) => readNotificationUnreadCount({ signal }),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const notificationsQuery = useQuery({
    queryKey: recentNotificationsQueryKey,
    queryFn: ({ signal }) => listRecentNotifications({ signal }),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(notificationUnreadCountQueryKey, 0);
      queryClient.setQueryData<NotificationSummary[] | undefined>(
        recentNotificationsQueryKey,
        (current) =>
          current?.map((notification) => ({ ...notification, isRead: true })) ?? current,
      );
      queryClient.invalidateQueries({ queryKey: notificationUnreadCountQueryKey }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: recentNotificationsQueryKey }).catch(() => undefined);
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: (result) => {
      if (!result) {
        return;
      }

      queryClient.setQueryData<NotificationSummary[] | undefined>(
        recentNotificationsQueryKey,
        (current) =>
          current?.map((notification) =>
            notification.id === result.id ? { ...notification, isRead: true } : notification,
          ) ?? current,
      );
      queryClient.setQueryData<number | undefined>(
        notificationUnreadCountQueryKey,
        (current) => (typeof current === "number" && current > 0 ? current - 1 : current),
      );
      queryClient.invalidateQueries({ queryKey: notificationUnreadCountQueryKey }).catch(() => undefined);
    },
  });

  const dataState =
    stateOverride ??
    getNotificationBellDataState({
      error: coerceNotificationQueryError(notificationsQuery.error),
      notifications: notificationsQuery.data,
      pending: notificationsQuery.isPending,
    });

  const unreadCount =
    unreadCountOverride ??
    (typeof unreadCountQuery.data === "number" ? unreadCountQuery.data : null);

  return (
    <NotificationBellMenu
      dataState={dataState}
      initialOpen={initialOpen}
      unreadCount={unreadCount}
      onRetry={() => {
        notificationsQuery.refetch().catch(() => undefined);
      }}
      onMarkAllAsRead={() => {
        markAllMutation.mutate();
      }}
      onSelectNotification={(notification) => {
        if (!notification.isRead) {
          markOneMutation.mutate(notification.id);
        }

        router.push(notification.url);
      }}
      onViewAll={() => {
        router.push("/notifications");
      }}
    />
  );
}
