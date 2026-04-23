import { Archive, CheckCircle2, Eye, Lock, MessageSquare, Send, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReadOnlyReason =
  | "locked"
  | "submitted"
  | "approved"
  | "archived"
  | "viewer"
  | "workspace-archived";

interface BannerSpec {
  icon: LucideIcon;
  iconColor: string;
  bg: string;
  border: string;
  message: (lockedByName?: string) => string;
  /** What the user CAN still do, surfaced to make read-only modes feel less dead-end. */
  available: string;
}

const SPECS: Record<ReadOnlyReason, BannerSpec> = {
  locked: {
    icon: Lock,
    iconColor: "text-amber-600",
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    message: (n) => `Locked by ${n ?? "another member"}. Editing is disabled.`,
    available: "You can still read, comment, and reply to discussion.",
  },
  submitted: {
    icon: Send,
    iconColor: "text-teal-600",
    bg: "bg-teal-50/80",
    border: "border-teal-200",
    message: () => "Submitted for review. Editing is paused until a reviewer responds.",
    available: "You can still leave review comments and follow the discussion.",
  },
  approved: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    bg: "bg-emerald-50/80",
    border: "border-emerald-200",
    message: () => "Approved. Editing is closed.",
    available: "You can still read comments, reply to threads, and view version history.",
  },
  archived: {
    icon: Archive,
    iconColor: "text-stone-500",
    bg: "bg-stone-50/80",
    border: "border-stone-200",
    message: () => "This document is archived. Viewing only.",
    available: "Past comments and revisions remain available for reference.",
  },
  viewer: {
    icon: Eye,
    iconColor: "text-stone-500",
    bg: "bg-stone-50/80",
    border: "border-stone-200",
    message: () => "You have view-only access to this document.",
    available: "You can read the document and any open comments.",
  },
  "workspace-archived": {
    icon: Archive,
    iconColor: "text-amber-600",
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    message: () => "This workspace is archived. All documents are read-only.",
    available: "You can still read documents and historical discussion.",
  },
};

interface EditorReadOnlyBannerProps {
  reason: ReadOnlyReason;
  lockedByName?: string;
}

export const EditorReadOnlyBanner = ({ reason, lockedByName }: EditorReadOnlyBannerProps) => {
  const spec = SPECS[reason];
  const Icon = spec.icon;
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 px-4 py-2 border-b text-sm flex-shrink-0",
        spec.bg,
        spec.border,
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", spec.iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-stone-800 text-[13px] font-medium">{spec.message(lockedByName)}</p>
        <p className="text-stone-500 text-[12px] mt-0.5 flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          {spec.available}
        </p>
      </div>
    </div>
  );
};
