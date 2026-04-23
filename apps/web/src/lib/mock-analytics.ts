// Mock analytics for the workspace analytics surface. Designed for
// manager+ / supervisor view. Calm shape, not chart spam.

export interface KpiBlock {
  key: string;
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; tone?: "good" | "bad" | "neutral" };
  helper?: string;
}

export interface MemberContribution {
  id: string;
  fullName: string;
  role: string;
  docsAuthored: number;
  tasksCompleted: number;
  commentsLeft: number;
  lastActiveAt: string;
}

export interface DocumentProgress {
  status: "draft" | "submitted" | "changes_requested" | "approved" | "archived";
  count: number;
}

export interface TaskThroughputPoint {
  weekLabel: string;
  completed: number;
  created: number;
}

export interface ActivityTrendPoint {
  dayLabel: string;
  events: number;
}

export interface AnalyticsSnapshot {
  kpis: KpiBlock[];
  documents: DocumentProgress[];
  members: MemberContribution[];
  throughput: TaskThroughputPoint[];
  trend: ActivityTrendPoint[];
  academic: {
    enabled: boolean;
    pendingReviews: number;
    avgReviewTurnaroundHours: number;
    overdueSubmissions: number;
  };
}

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

export const MOCK_ANALYTICS: AnalyticsSnapshot = {
  kpis: [
    {
      key: "active-members",
      label: "Active members",
      value: "6",
      delta: { value: "+1", direction: "up", tone: "good" },
      helper: "vs. last 14 days",
    },
    {
      key: "docs-updated",
      label: "Docs updated",
      value: "42",
      delta: { value: "+18%", direction: "up", tone: "good" },
      helper: "this week",
    },
    {
      key: "tasks-completed",
      label: "Tasks completed",
      value: "27",
      delta: { value: "−4%", direction: "down", tone: "bad" },
      helper: "this week",
    },
    {
      key: "open-blockers",
      label: "Open blockers",
      value: "3",
      delta: { value: "0", direction: "flat", tone: "neutral" },
      helper: "no change",
    },
  ],
  documents: [
    { status: "draft", count: 14 },
    { status: "submitted", count: 7 },
    { status: "changes_requested", count: 3 },
    { status: "approved", count: 22 },
    { status: "archived", count: 5 },
  ],
  members: [
    {
      id: "u1",
      fullName: "Elshaday Tesfaye",
      role: "OWNER",
      docsAuthored: 12,
      tasksCompleted: 18,
      commentsLeft: 34,
      lastActiveAt: iso(5 * 60 * 1000),
    },
    {
      id: "u2",
      fullName: "Eyob Bekele",
      role: "MEMBER",
      docsAuthored: 6,
      tasksCompleted: 11,
      commentsLeft: 22,
      lastActiveAt: iso(2 * 60 * 60 * 1000),
    },
    {
      id: "u3",
      fullName: "Kidist Alemu",
      role: "MEMBER",
      docsAuthored: 9,
      tasksCompleted: 7,
      commentsLeft: 17,
      lastActiveAt: iso(6 * 60 * 60 * 1000),
    },
    {
      id: "u4",
      fullName: "Mekonnen Desta",
      role: "MEMBER",
      docsAuthored: 4,
      tasksCompleted: 9,
      commentsLeft: 8,
      lastActiveAt: iso(24 * 60 * 60 * 1000),
    },
    {
      id: "u5",
      fullName: "Bethel Tekle",
      role: "VIEWER",
      docsAuthored: 0,
      tasksCompleted: 0,
      commentsLeft: 6,
      lastActiveAt: iso(3 * 24 * 60 * 60 * 1000),
    },
  ],
  throughput: [
    { weekLabel: "W37", completed: 14, created: 18 },
    { weekLabel: "W38", completed: 19, created: 16 },
    { weekLabel: "W39", completed: 22, created: 24 },
    { weekLabel: "W40", completed: 27, created: 21 },
  ],
  trend: [
    { dayLabel: "Mon", events: 18 },
    { dayLabel: "Tue", events: 26 },
    { dayLabel: "Wed", events: 31 },
    { dayLabel: "Thu", events: 22 },
    { dayLabel: "Fri", events: 14 },
    { dayLabel: "Sat", events: 5 },
    { dayLabel: "Sun", events: 3 },
  ],
  academic: {
    enabled: false,
    pendingReviews: 0,
    avgReviewTurnaroundHours: 0,
    overdueSubmissions: 0,
  },
};

export const MOCK_ANALYTICS_ACADEMIC: AnalyticsSnapshot = {
  ...MOCK_ANALYTICS,
  academic: {
    enabled: true,
    pendingReviews: 4,
    avgReviewTurnaroundHours: 36,
    overdueSubmissions: 1,
  },
};
