import { fullDateTime, relativeTime } from "@/lib/format";
import type { ActivityEvent } from "@/api/adapters/activity";
import { ActivityEventIcon } from "./activity-event-icon";

interface ActivityEventItemProps {
  event: ActivityEvent;
  showConnector: boolean;
}

function getEventActionText(event: ActivityEvent): string {
  const actorName = event.actor.fullName;
  if (event.summary.startsWith(actorName)) {
    return event.summary.slice(actorName.length).trim();
  }
  return event.summary;
}

export function ActivityEventItem({ event, showConnector }: ActivityEventItemProps) {
  return (
    <div className="flex gap-3.5 relative group">
      {showConnector && (
        <div
          className="absolute left-[15px] top-10 bottom-0 w-px bg-gradient-to-b from-stone-200 to-stone-100"
          aria-hidden="true"
        />
      )}

      <ActivityEventIcon eventKey={event.eventKey} />

      <div className="flex-1 min-w-0 pb-6 pt-0.5">
        {/* Sentence — actor + verb */}
        <p className="text-[13px] text-stone-600 leading-relaxed">
          <span
            className={
              event.actor.isFormer
                ? "italic text-stone-500"
                : "font-semibold text-stone-900"
            }
          >
            {event.actor.fullName}
          </span>{" "}
          {getEventActionText(event)}
        </p>

        {/* Resource — visually distinct */}
        {event.resource && (
          <div className="mt-1.5 inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-2.5 py-1 group-hover:border-stone-300 transition-colors">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-teal-500/70"
            />
            <span className="text-[12.5px] font-medium text-stone-700 truncate max-w-[34ch]">
              {event.resource.title}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <time
            dateTime={event.createdAt}
            title={fullDateTime(event.createdAt)}
            className="font-mono text-[10px] text-stone-400 tracking-wider uppercase tabular-nums"
          >
            {relativeTime(event.createdAt)}
          </time>
        </div>
      </div>
    </div>
  );
}
