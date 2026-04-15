import type { WorkspaceType } from "./api/workspaces";

export const getInitials = (value: string, max = 2) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "CS";

export const fullDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const relativeTime = (value: string | null | undefined, now = Date.now()) => {
  if (!value) {
    return "No activity yet";
  }

  const target = Date.parse(value);
  if (Number.isNaN(target)) {
    return "Recently";
  }

  const diffMs = target - now;
  const diffMinutes = Math.round(diffMs / 60_000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, "day");
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(target),
  );
};

export const getGreeting = (name = "there", hour = new Date().getHours()) => {
  const firstName = name.split(/\s+/)[0] || "there";

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
    subtitle: "Wrapping up? Here's your collaboration overview.",
  };
};

export const getWorkspaceTypeClasses = (type: WorkspaceType) => {
  if (type === "professional") {
    return {
      badge: "border-teal-200 bg-teal-50 text-teal-700",
      mark: "border-teal-200 bg-teal-50 text-teal-700",
      dot: "bg-teal-500",
    };
  }

  if (type === "academic") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      mark: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    badge: "border-stone-200 bg-stone-100 text-stone-600",
    mark: "border-stone-200 bg-stone-100 text-stone-600",
    dot: "bg-stone-400",
  };
};

export const avatarColorScale = ["#0d9488", "#0284c7", "#d97706", "#7c3aed", "#475569"] as const;

