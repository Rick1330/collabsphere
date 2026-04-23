import { describe, it, expect } from "vitest";
import {
  fetchNotifications,
  fetchUnreadCount,
  fetchNotificationCategoryCounts,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_CATEGORY_META,
} from "./notifications";

// These tests exercise the live in-memory mock-store. They run in declaration
// order: read-only assertions first, then mutations at the end. Re-ordering
// would make later tests see "everything already read" state.
describe("api/adapters/notifications", () => {
  it("paginates the feed and returns correct meta totals", async () => {
    const page1 = await fetchNotifications({
      page: 1,
      pageSize: 10,
      unreadOnly: false,
    });
    expect(page1.data.items).toHaveLength(10);
    expect(page1.meta.pagination.page).toBe(1);
    expect(page1.meta.pagination.pageSize).toBe(10);
    expect(page1.meta.pagination.totalItems).toBeGreaterThan(10);
    expect(page1.meta.pagination.totalPages).toBe(
      Math.ceil(page1.meta.pagination.totalItems / 10),
    );

    const page2 = await fetchNotifications({
      page: 2,
      pageSize: 10,
      unreadOnly: false,
    });
    // No id overlap between adjacent pages -> stable ordering.
    const ids1 = new Set(page1.data.items.map((n) => n.id));
    for (const item of page2.data.items) {
      expect(ids1.has(item.id)).toBe(false);
    }
  });

  it("respects the unreadOnly filter", async () => {
    const all = await fetchNotifications({ page: 1, pageSize: 100, unreadOnly: false });
    const unread = await fetchNotifications({ page: 1, pageSize: 100, unreadOnly: true });
    expect(unread.data.items.every((n) => !n.isRead)).toBe(true);
    expect(unread.meta.pagination.totalItems).toBeLessThanOrEqual(
      all.meta.pagination.totalItems,
    );
  });

  it("respects the category filter", async () => {
    const tasksOnly = await fetchNotifications({
      page: 1,
      pageSize: 100,
      unreadOnly: false,
      category: "tasks",
    });
    expect(tasksOnly.data.items.length).toBeGreaterThan(0);
    for (const n of tasksOnly.data.items) {
      expect(NOTIFICATION_CATEGORY[n.type]).toBe("tasks");
    }
  });

  it("category counts sum to the global total for the same filter", async () => {
    const counts = await fetchNotificationCategoryCounts(false);
    const sum = (Object.values(counts.data.byCategory) as number[]).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBe(counts.data.all);
    // Every category surfaces in the meta map -> chip rendering won't blank.
    for (const cat of Object.keys(counts.data.byCategory)) {
      expect(NOTIFICATION_CATEGORY_META[cat as keyof typeof NOTIFICATION_CATEGORY_META]).toBeDefined();
    }
  });

  it("markNotificationRead drops one from the unread count", async () => {
    const before = await fetchUnreadCount();
    if (before.data.unreadCount === 0) return; // nothing to mark
    const unreadPage = await fetchNotifications({
      page: 1,
      pageSize: 5,
      unreadOnly: true,
    });
    const target = unreadPage.data.items[0];
    expect(target).toBeDefined();
    await markNotificationRead(target.id);
    const after = await fetchUnreadCount();
    expect(after.data.unreadCount).toBe(before.data.unreadCount - 1);
  });

  it("markAllNotificationsRead zeros the unread count and reports the delta", async () => {
    const before = await fetchUnreadCount();
    const result = await markAllNotificationsRead();
    expect(result.data.updatedCount).toBe(before.data.unreadCount);
    const after = await fetchUnreadCount();
    expect(after.data.unreadCount).toBe(0);
  });
});
