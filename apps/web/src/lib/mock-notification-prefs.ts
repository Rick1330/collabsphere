export interface NotificationPreferences {
  inApp: Record<string, boolean>;
  email: Record<string, boolean>;
  dailyDigestEnabled: boolean;
  weeklyDigestEnabled: boolean;
}

export const NOTIFICATION_TYPES: { key: string; label: string }[] = [
  { key: "task.assigned", label: "Task assigned to you" },
  { key: "task.completed", label: "Task completed" },
  { key: "task.status_changed", label: "Task status changed" },
  { key: "document.mention", label: "Mentioned in a document" },
  { key: "comment.reply", label: "Reply to your comment" },
  { key: "workspace.member_joined", label: "New member joined" },
  { key: "workspace.invitation", label: "Workspace invitation" },
  { key: "deadline.reminder", label: "Deadline reminders" },
];

const STORAGE_KEY = "cs-notification-prefs";

const DEFAULT: NotificationPreferences = {
  inApp: Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t.key, true])),
  email: Object.fromEntries(
    NOTIFICATION_TYPES.map((t) => [t.key, ["task.assigned", "workspace.invitation", "deadline.reminder"].includes(t.key)]),
  ),
  dailyDigestEnabled: false,
  weeklyDigestEnabled: true,
};

function read(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      ...DEFAULT,
      ...parsed,
      inApp: { ...DEFAULT.inApp, ...(parsed.inApp ?? {}) },
      email: { ...DEFAULT.email, ...(parsed.email ?? {}) },
    };
  } catch {
    return DEFAULT;
  }
}

function write(prefs: NotificationPreferences) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  await delay(200);
  return read();
}

export async function updateNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  await delay();
  write(prefs);
}
