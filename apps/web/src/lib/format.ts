export function getInitials(name: string, maxChars = 2): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, maxChars).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).slice(0, maxChars).toUpperCase();
}

export function getGreeting(name: string): { greeting: string; subtitle: string } {
  const hour = new Date().getHours();
  const firstName = (name || "there").split(" ")[0];
  if (hour < 12) {
    return {
      greeting: `Good morning, ${firstName}`,
      subtitle: "Here's what needs your attention today.",
    };
  }
  if (hour < 17) {
    return {
      greeting: `Good afternoon, ${firstName}`,
      subtitle: "Here's what's happening across your workspaces.",
    };
  }
  return {
    greeting: `Good evening, ${firstName}`,
    subtitle: "Wrapping up? Here's your workspace overview.",
  };
}

export function relativeTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(day / 365)}y ago`;
}

export function fullDateTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDueDate(input: string | Date): {
  text: string;
  isOverdue: boolean;
  isDueToday: boolean;
} {
  const date = typeof input === "string" ? new Date(input) : input;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86_400_000);
  const isOverdue = date.getTime() < now.getTime() && dayDiff < 0;
  const isDueToday = dayDiff === 0;
  let text: string;
  if (isOverdue) {
    const overdueDays = Math.abs(dayDiff);
    text = overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`;
  } else if (isDueToday) {
    text = "Due today";
  } else if (dayDiff === 1) {
    text = "Due tomorrow";
  } else if (dayDiff < 7) {
    text = `Due in ${dayDiff} days`;
  } else {
    text = `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return { text, isOverdue, isDueToday };
}

const AVATAR_PALETTE = ["#0D9488", "#0284C7", "#D97706", "#059669", "#DC2626", "#7C3AED", "#DB2777"];
export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
export const AVATAR_COLORS = AVATAR_PALETTE;
