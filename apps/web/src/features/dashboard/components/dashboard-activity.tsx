import { forwardRef, useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionError } from "@/components/shared/section-error";
import { fullDateTime, getAvatarColor, getInitials, relativeTime } from "@/lib/format";
import {
  getDashboardActivity,
  type DashboardActivityEvent,
} from "@/api/adapters/dashboard";

type ActivityEvent = DashboardActivityEvent;

const actionText = (e: ActivityEvent): string => {
  switch (e.action) {
    case "created": return `created a new ${e.resource?.type ?? "item"}`;
    case "updated": return `updated a ${e.resource?.type ?? "item"}`;
    case "commented": return `left a comment on`;
    case "completed": return `completed a ${e.resource?.type ?? "task"}`;
    case "shared": return `shared a ${e.resource?.type ?? "item"}`;
  }
};

type State = "loading" | "loaded" | "empty" | "error";

export const DashboardActivity = () => {
  const [state, setState] = useState<State>("loading");
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getDashboardActivity()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        setState(data.length === 0 ? "empty" : "loaded");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section aria-labelledby="activity-heading">
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-stone-100" />
        <span id="activity-heading" className="font-mono text-[9px] text-stone-400 tracking-[0.15em] uppercase">
          Recent activity
        </span>
        <div className="h-px flex-1 bg-stone-100" />
      </div>

      {state === "loading" && <Loading />}
      {state === "empty" && <Empty />}
      {state === "error" && (
        <SectionError sectionName="activity" requestId="req_a93b41ee" onRetry={() => setState("loaded")} />
      )}
      {state === "loaded" && (
        <div>
          {events.slice(0, 10).map((event, i) => (
            <EventRow key={event.id} event={event} showConnector={i < events.length - 1} />
          ))}
        </div>
      )}
    </section>
  );
};

const EventRow = forwardRef<
  HTMLDivElement,
  { event: ActivityEvent; showConnector: boolean }
>(({ event, showConnector }, ref) => (
  <div ref={ref} className="relative">
    {showConnector && (
      <div className="absolute left-[15px] top-9 bottom-0 w-px bg-stone-100" aria-hidden="true" />
    )}
    <div className="flex gap-3 pb-5">
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border-2 border-white shadow-sm"
        style={{ backgroundColor: getAvatarColor(event.actor.id), color: "white" }}
        aria-hidden="true"
      >
        {getInitials(event.actor.fullName, 1)}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[13px] text-stone-600 leading-relaxed">
          <span className="font-medium text-stone-900">{event.actor.fullName}</span>{" "}
          {actionText(event)}
        </p>
        {event.resource && (
          <p className="text-[13px] text-stone-500 mt-0.5 truncate">
            <span className="font-medium text-stone-700">"{event.resource.title}"</span>
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-[10px] text-stone-400 tracking-wider px-1.5 py-0.5 rounded bg-stone-50 border border-stone-100">
            {event.workspaceName}
          </span>
          <time
            dateTime={event.createdAt}
            title={fullDateTime(event.createdAt)}
            className="font-mono text-[10px] text-stone-400 tracking-wider"
          >
            {relativeTime(event.createdAt)}
          </time>
        </div>
      </div>
    </div>
  </div>
));

EventRow.displayName = "EventRow";

const Loading = () => (
  <div aria-busy="true">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex gap-3 pb-5">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-3.5 w-4/5 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Empty = () => (
  <div className="py-8 text-center">
    <div className="h-10 w-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
      <Activity className="h-5 w-5 text-stone-400" />
    </div>
    <p className="text-sm text-stone-500 mt-3">No recent activity</p>
    <p className="text-xs text-stone-400 mt-1">Activity will appear here as your team collaborates.</p>
  </div>
);
