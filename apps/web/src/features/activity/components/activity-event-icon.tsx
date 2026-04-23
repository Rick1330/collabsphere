import {
  Activity,
  Archive,
  ArchiveRestore,
  ArrowRight,
  CheckCircle2,
  CheckCheck,
  FileEdit,
  FilePlus,
  FolderInput,
  FolderPlus,
  History,
  Lock,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Shield,
  Stamp,
  Trash2,
  Unlock,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IconConfig {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

const EVENT_ICON_MAP: Record<string, IconConfig> = {
  // Task events — teal
  "task.created": { icon: Plus, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  "task.assigned": { icon: UserPlus, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  "task.status_changed": { icon: ArrowRight, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  "task.completed": { icon: CheckCircle2, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  "task.deleted": { icon: Trash2, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  // Document events — sky
  "document.created": { icon: FilePlus, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "document.renamed": { icon: FileEdit, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "document.moved": { icon: FolderInput, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "document.locked": { icon: Lock, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "document.unlocked": { icon: Unlock, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "document.version_created": { icon: History, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  "document.version_restored": { icon: RotateCcw, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  // Document review events — indigo
  "document.submitted": { icon: Send, iconColor: "text-indigo-600", bgColor: "bg-indigo-50" },
  "document.reviewed": { icon: Stamp, iconColor: "text-indigo-600", bgColor: "bg-indigo-50" },
  // Member events — emerald
  "workspace.member_joined": { icon: UserPlus, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  "workspace.member_removed": { icon: UserMinus, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  "workspace.member_role_changed": { icon: Shield, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  "workspace.role_changed": { icon: Shield, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  // Workspace events — amber
  "workspace.created": { icon: FolderPlus, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
  "workspace.archived": { icon: Archive, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
  "workspace.unarchived": { icon: ArchiveRestore, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
  // Comment events — stone
  "comment.created": { icon: MessageSquare, iconColor: "text-stone-500", bgColor: "bg-stone-100" },
  "comment.resolved": { icon: CheckCheck, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
};

const DEFAULT_ICON: IconConfig = {
  icon: Activity,
  iconColor: "text-stone-500",
  bgColor: "bg-stone-100",
};

export function ActivityEventIcon({ eventKey }: { eventKey: string }) {
  const config = EVENT_ICON_MAP[eventKey] ?? DEFAULT_ICON;
  const Icon = config.icon;
  return (
    <div
      className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
        "border border-white shadow-sm",
        config.bgColor,
      )}
    >
      <Icon className={cn("h-4 w-4", config.iconColor)} aria-hidden="true" />
    </div>
  );
}
