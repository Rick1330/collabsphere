import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  NotificationBellMenu,
  formatNotificationBadgeCount,
  formatNotificationRelativeTimestamp,
  getClampedNotificationMenuIndex,
  getNotificationBellDataState,
  getNotificationBodyPreview,
  getNotificationMenuNextIndex,
  getNotificationMenuOpenIndex,
  getSafeNotificationHref,
  getNotificationTypeMark,
  isNotificationMenuNavigationKey,
  isNotificationMenuOpenKey,
} from "../../apps/web/src/components/shell/notification-bell";
import {
  NotificationApiError,
  listRecentNotifications,
  markNotificationAsRead,
  parseNotificationListResponse,
  parseNotificationUnreadCountResponse,
  readNotificationUnreadCount,
  sortNotificationsByRecency,
  type NotificationSummary,
} from "../../apps/web/src/lib/api/notifications";

const notificationFixtures: NotificationSummary[] = [
  {
    id: "notif-2",
    type: "document.mention",
    workspaceId: "workspace-alpha",
    title: "Comment mention",
    body: "Mara mentioned you in the architecture review thread.",
    url: "/w/workspace-alpha/documents/architecture-review",
    isRead: false,
    createdAt: "2025-07-17T12:10:00Z",
  },
  {
    id: "notif-1",
    type: "task.assigned",
    workspaceId: "workspace-alpha",
    title: "Task assigned to you",
    body: "Implement the notification bell dropdown before standup tomorrow.",
    url: "/w/workspace-alpha/tasks/notif-task",
    isRead: true,
    createdAt: "2025-07-17T09:00:00Z",
  },
];

test("formatNotificationBadgeCount hides zero and caps counts at 99+", () => {
  assert.equal(formatNotificationBadgeCount(0), null);
  assert.equal(formatNotificationBadgeCount(12), "12");
  assert.equal(formatNotificationBadgeCount(120), "99+");
});

test("notification menu keyboard helpers remain deterministic", () => {
  assert.equal(isNotificationMenuOpenKey("Enter"), true);
  assert.equal(isNotificationMenuOpenKey("Escape"), false);
  assert.equal(isNotificationMenuNavigationKey("ArrowDown"), true);
  assert.equal(isNotificationMenuNavigationKey("Tab"), false);
  assert.equal(getNotificationMenuOpenIndex({ key: "ArrowDown", itemCount: 3 }), 0);
  assert.equal(getNotificationMenuOpenIndex({ key: "ArrowUp", itemCount: 3 }), 2);
  assert.equal(getNotificationMenuNextIndex({ currentIndex: 0, key: "ArrowUp", itemCount: 3 }), 2);
  assert.equal(
    getNotificationMenuNextIndex({ currentIndex: 2, key: "ArrowDown", itemCount: 3 }),
    0,
  );
  assert.equal(getNotificationMenuNextIndex({ currentIndex: 1, key: "Home", itemCount: 3 }), 0);
  assert.equal(getClampedNotificationMenuIndex({ currentIndex: 5, itemCount: 2 }), 1);
  assert.equal(getClampedNotificationMenuIndex({ currentIndex: 0, itemCount: 0 }), -1);
});

test("sortNotificationsByRecency orders newest first and falls back to title", () => {
  const sorted = sortNotificationsByRecency([
    notificationFixtures[1],
    notificationFixtures[0],
    {
      ...notificationFixtures[0],
      id: "notif-3",
      title: "Alpha notice",
      createdAt: "not-a-date",
    },
    {
      ...notificationFixtures[0],
      id: "notif-4",
      title: "Bravo notice",
      createdAt: "not-a-date",
    },
  ]);

  assert.deepEqual(sorted.map((notification) => notification.id), [
    "notif-2",
    "notif-1",
    "notif-3",
    "notif-4",
  ]);
});

test("notification parsers enforce unread count and list envelopes", () => {
  const unreadCount = parseNotificationUnreadCountResponse({
    data: { unreadCount: 7 },
  });
  const notifications = parseNotificationListResponse({
    data: { items: notificationFixtures },
  });

  assert.equal(unreadCount, 7);
  assert.equal(notifications[0]?.id, "notif-2");
});

test("notification helper formatting produces compact preview and timestamp copy", () => {
  assert.equal(getNotificationTypeMark("task.assigned"), "TK");
  assert.equal(getNotificationTypeMark("document.mention"), "DC");
  assert.equal(getSafeNotificationHref("/w/workspace-alpha/tasks/task-1"), "/w/workspace-alpha/tasks/task-1");
  assert.equal(getSafeNotificationHref("https://malicious.example"), "/notifications");
  assert.equal(getSafeNotificationHref("//malicious.example"), "/notifications");
  assert.equal(
    getNotificationBodyPreview({ body: "A short body", maxLength: 40 }),
    "A short body",
  );
  assert.match(
    getNotificationBodyPreview({
      body: "This is a deliberately long notification body that should be truncated cleanly.",
      maxLength: 32,
    }),
    /…$/,
  );
  assert.equal(
    formatNotificationRelativeTimestamp({
      createdAt: "2025-07-17T12:09:00Z",
      now: Date.parse("2025-07-17T12:10:00Z"),
    }),
    "1m ago",
  );
});

test("getNotificationBellDataState preserves cached data while exposing uncached errors", () => {
  const serverError = new NotificationApiError(
    "server",
    "Failed to load notifications. Please try again.",
    { requestId: "req_notifications" },
  );

  const loadedState = getNotificationBellDataState({
    error: serverError,
    notifications: notificationFixtures,
    pending: false,
  });
  assert.equal(loadedState.kind, "loaded");

  const uncachedErrorState = getNotificationBellDataState({
    error: serverError,
    notifications: undefined,
    pending: false,
  });
  assert.equal(uncachedErrorState.kind, "error");
  if (uncachedErrorState.kind !== "error") {
    assert.fail("Expected uncached notification error state.");
  }
  assert.equal(uncachedErrorState.requestId, "req_notifications");
});

test("notification bell renders loaded state with unread badge, recent items, and footer actions", () => {
  const markup = renderToStaticMarkup(
    <NotificationBellMenu
      initialOpen
      unreadCount={12}
      dataState={{ kind: "loaded", notifications: notificationFixtures }}
    />,
  );

  assert.match(markup, /aria-haspopup="menu"/);
  assert.match(markup, /Notifications/);
  assert.match(markup, /aria-label="12 unread notifications"/);
  assert.match(markup, /12 unread notifications/);
  assert.match(markup, /Comment mention/);
  assert.match(markup, /Task assigned to you/);
  assert.match(markup, /Mark all as read/);
  assert.match(markup, /View all notifications/);
});

test("notification bell renders empty and error states truthfully", () => {
  const emptyMarkup = renderToStaticMarkup(
    <NotificationBellMenu
      initialOpen
      unreadCount={0}
      dataState={{ kind: "empty" }}
    />,
  );
  const errorMarkup = renderToStaticMarkup(
    <NotificationBellMenu
      initialOpen
      unreadCount={null}
      dataState={{
        kind: "error",
        message: "Failed to load notifications. Please try again.",
        requestId: "req_notification_error",
      }}
    />,
  );

  assert.match(emptyMarkup, /You&#x27;re all caught up!/);
  assert.match(emptyMarkup, /View all notifications/);
  assert.doesNotMatch(emptyMarkup, /notification-bell__badge/);
  assert.match(errorMarkup, /Failed to load notifications/);
  assert.match(errorMarkup, /Retry notifications/);
  assert.match(errorMarkup, /req_notification_error/);
});

test("readNotificationUnreadCount classifies network failures safely", async () => {
  const fetchFn: typeof fetch = async () => {
    throw new TypeError("fetch failed");
  };

  await assert.rejects(
    () => readNotificationUnreadCount({ fetchFn }),
    (error) =>
      error instanceof NotificationApiError &&
      error.kind === "network" &&
      error.message === "Failed to load notifications. Check your connection and retry.",
  );
});

test("listRecentNotifications classifies malformed responses as non-network failures", async () => {
  const fetchFn: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          items: [{ id: "notif-bad" }],
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );

  await assert.rejects(
    () => listRecentNotifications({ fetchFn }),
    (error) =>
      error instanceof NotificationApiError &&
      error.kind === "unknown" &&
      error.message === "The notifications response was malformed.",
  );
});

test("markNotificationAsRead rejects blank notification ids before issuing a request", async () => {
  await assert.rejects(
    () => markNotificationAsRead(""),
    (error) =>
      error instanceof NotificationApiError &&
      error.kind === "validation" &&
      error.message === "The notification update could not be completed.",
  );
});
