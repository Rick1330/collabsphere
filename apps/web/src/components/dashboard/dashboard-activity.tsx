"use client";

import Link from "next/link";

import type { ActivityApiError, MyActivityItem } from "@/lib/api/activity";
import { avatarColorScale, fullDateTime, getInitials, relativeTime } from "@/lib/format";
import { SectionError } from "@/components/shared/section-error";

type DashboardActivityProps = {
  activity: readonly MyActivityItem[] | undefined;
  isPending: boolean;
  error: ActivityApiError | null;
  onRetry: () => void;
};

type ActivityViewState = "loading" | "error" | "not-ready" | "empty" | "content" | "idle";

function ActivitySkeleton() {
  return (
    <div className="flex gap-3">
      <div className="h-9 w-9 rounded-full bg-stone-100" />
      <div className="flex-1">
        <div className="h-3.5 w-48 rounded bg-stone-100" />
        <div className="mt-2 h-3 w-28 rounded bg-stone-100" />
      </div>
    </div>
  );
}

function ActivityTimeline({ activity }: Readonly<{ activity: readonly MyActivityItem[] }>) {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[0.95rem] top-2 w-px bg-stone-100" aria-hidden="true" />
      <ol className="space-y-4 pl-4">
        {activity.slice(0, 10).map((item, index) => {
          const avatarColor = avatarColorScale[index % avatarColorScale.length];
          const content = (
            <>
              <span
                className="relative z-[1] mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: avatarColor }}
                aria-hidden="true"
              >
                {getInitials(item.actorName, 1)}
              </span>
              <div className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-stone-700">
                  <span className="font-semibold text-stone-900">{item.actorName}</span> {item.summary}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
                  {item.workspaceName ? (
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 font-mono uppercase tracking-[0.16em] text-stone-500">
                      {item.workspaceName}
                    </span>
                  ) : null}
                  <time dateTime={item.createdAt} title={fullDateTime(item.createdAt)} className="font-mono">
                    {relativeTime(item.createdAt)}
                  </time>
                </div>
              </div>
            </>
          );

          return (
            <li key={item.id} className="relative flex gap-3">
              {item.url ? (
                <Link
                  href={item.url}
                  className="flex w-full gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ActivityUnavailableState({ error, onRetry }: Readonly<{ error: ActivityApiError; onRetry: () => void }>) {
  return (
    <SectionError
      title="Activity feed unavailable"
      message={error.message}
      requestId={error.requestId}
      onRetry={onRetry}
    />
  );
}

function ActivityNotReadyState() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="font-semibold text-stone-900">Activity timeline comes online with collaboration feeds</p>
      <p className="mt-2 text-sm text-stone-500">
        The shell is ready for it; this environment has not exposed the personal activity endpoint yet.
      </p>
    </div>
  );
}

function ActivityEmptyState() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="font-semibold text-stone-900">No recent activity</p>
      <p className="mt-2 text-sm text-stone-500">
        Once collaboration starts moving, this timeline will show who changed what and where.
      </p>
    </div>
  );
}

function getActivityViewState({
  activity,
  error,
  isPending,
}: Readonly<Pick<DashboardActivityProps, "activity" | "error" | "isPending">>): ActivityViewState {
  const hasActivityData = Boolean(activity);

  if (!hasActivityData) {
    if (isPending) {
      return "loading";
    }

    if (error?.kind === "not-found") {
      return "not-ready";
    }

    if (error) {
      return "error";
    }

    return "idle";
  }

  return activity!.length > 0 ? "content" : "empty";
}

function DashboardActivityBody({
  activity,
  error,
  isPending,
  onRetry,
}: Readonly<DashboardActivityProps>) {
  switch (getActivityViewState({ activity, error, isPending })) {
    case "loading":
      return (
        <div className="space-y-4">
          <ActivitySkeleton />
          <ActivitySkeleton />
          <ActivitySkeleton />
        </div>
      );
    case "error":
      return error ? <ActivityUnavailableState error={error} onRetry={onRetry} /> : null;
    case "not-ready":
      return <ActivityNotReadyState />;
    case "empty":
      return <ActivityEmptyState />;
    case "content":
      return activity ? <ActivityTimeline activity={activity} /> : null;
    default:
      return null;
  }
}

export function DashboardActivity(props: Readonly<DashboardActivityProps>) {
  return (
    <section aria-labelledby="dashboard-activity-heading" className="space-y-4 border-t border-stone-100 pt-6">
      <h2 id="dashboard-activity-heading" className="text-sm font-semibold text-stone-900">
        Recent activity
      </h2>
      <DashboardActivityBody {...props} />
    </section>
  );
}
