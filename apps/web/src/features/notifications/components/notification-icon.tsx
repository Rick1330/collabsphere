import {
  ArrowRight,
  AtSign,
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Send,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/api/adapters/notifications";

const NOTIFICATION_ICON_MAP: Record<
  NotificationType,
  { icon: LucideIcon; iconColor: string; bgColor: string }
> = {
  "task.assigned": { icon: UserPlus, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  "task.completed": { icon: CheckCircle2, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  "task.status_changed": { icon: ArrowRight, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  "document.mention": { icon: AtSign, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "document.submitted": { icon: Send, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "document.approved": { icon: CheckCircle2, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "comment.reply": { icon: MessageSquare, iconColor: "text-stone-500", bgColor: "bg-stone-100" },
  "workspace.member_joined": { icon: UserPlus, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  "workspace.invitation": { icon: Mail, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  "deadline.reminder": { icon: Clock, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
};

const DEFAULT = { icon: Bell, iconColor: "text-stone-500", bgColor: "bg-stone-100" };

export const NotificationIcon = ({ type }: { type: NotificationType | string }) => {
  const config = NOTIFICATION_ICON_MAP[type as NotificationType] ?? DEFAULT;
  const Icon = config.icon;
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
        config.bgColor,
      )}
    >
      <Icon className={cn("h-5 w-5", config.iconColor)} aria-hidden="true" />
    </div>
  );
};
