import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { fullDateTime, relativeTime } from "@/lib/format";
import { NotificationIcon } from "./notification-icon";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_CATEGORY_META,
  type Notification,
} from "@/api/adapters/notifications";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

const TONE_CHIP: Record<
  "teal" | "sky" | "stone" | "emerald" | "amber",
  string
> = {
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  stone: "bg-stone-100 text-stone-600 border-stone-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
};

export const NotificationItem = ({ notification, onMarkRead }: NotificationItemProps) => {
  const category = NOTIFICATION_CATEGORY[notification.type];
  const categoryMeta = NOTIFICATION_CATEGORY_META[category];
  const unread = !notification.isRead;

  return (
    <Link
      to={notification.url}
      onClick={() => {
        if (unread) onMarkRead(notification.id);
      }}
      className={cn(
        "group relative flex items-start gap-4 px-5 py-4 transition-colors duration-150",
        "hover:bg-stone-50/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-inset",
        unread && "bg-teal-50/40",
      )}
    >
      {/* Left rail — unread accent bar */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] transition-colors",
          unread ? "bg-teal-500" : "bg-transparent group-hover:bg-stone-200",
        )}
      />

      <NotificationIcon type={notification.type} />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-relaxed",
            unread ? "text-stone-900 font-semibold" : "text-stone-600",
          )}
        >
          {notification.title}
        </p>

        {notification.body && (
          <p
            className={cn(
              "text-[12px] mt-1 line-clamp-2 leading-relaxed",
              unread ? "text-stone-500" : "text-stone-400",
            )}
          >
            {notification.body}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className={cn(
              "font-mono text-[9.5px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded border",
              TONE_CHIP[categoryMeta.tone],
            )}
          >
            {categoryMeta.label}
          </span>
          <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded bg-white text-stone-500 border border-stone-200">
            {notification.workspaceName}
          </span>
          <span aria-hidden="true" className="text-stone-300">
            ·
          </span>
          <time
            dateTime={notification.createdAt}
            title={fullDateTime(notification.createdAt)}
            className="font-mono text-[10px] text-stone-400 tracking-wider uppercase tabular-nums"
          >
            {relativeTime(notification.createdAt)}
          </time>
        </div>
      </div>

      {unread && (
        <span
          className="h-2 w-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"
          aria-label="Unread"
        />
      )}
    </Link>
  );
};
