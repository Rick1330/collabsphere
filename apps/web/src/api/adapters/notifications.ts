/**
 * Notifications API adapter.
 *
 * Canonical surface for the notification inbox: paginated reads, unread
 * count, mark-read mutations, category metadata, and shared types.
 * UI components MUST import from this module rather than the underlying
 * mocks in `@/lib/mock-notifications` / `@/lib/mock-notification-prefs`.
 */
export {
  fetchNotifications,
  fetchUnreadCount,
  fetchNotificationCategoryCounts,
  markNotificationRead,
  markAllNotificationsRead,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_CATEGORY_META,
  type Notification,
  type NotificationType,
  type NotificationCategory,
  type NotificationPage,
} from "@/lib/mock-notifications";

export {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  NOTIFICATION_TYPES,
  type NotificationPreferences,
} from "@/lib/mock-notification-prefs";
