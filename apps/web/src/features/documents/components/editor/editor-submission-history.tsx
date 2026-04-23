import { useState } from "react";
import {
  History,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  MessageSquareWarning,
  Clock,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeTime, fullDateTime, getInitials, getAvatarColor } from "@/lib/format";
import type { SubmissionRecord } from "@/lib/mock-academic";

interface EditorSubmissionHistoryProps {
  history: SubmissionRecord[];
}

/**
 * Collapsible submission-history surface. Lives below the review panel /
 * feedback banner so the document's review trail is always one click away.
 */
export const EditorSubmissionHistory = ({ history }: EditorSubmissionHistoryProps) => {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  // Show max 8 entries; older ones collapsed behind "show all"
  const VISIBLE = 8;
  const visible = history.slice(0, VISIBLE);
  const hidden = Math.max(0, history.length - VISIBLE);

  const pendingCount = history.filter((h) => !h.decision).length;
  const approvedCount = history.filter((h) => h.decision === "approved").length;
  const changesCount = history.filter((h) => h.decision === "changes_requested").length;

  return (
    <div className="flex-shrink-0 border-b border-stone-200 bg-stone-50/40">
      <div className="max-w-3xl mx-auto px-6 md:px-10 lg:px-16">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full py-2.5 flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-stone-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-stone-500 flex-shrink-0" />
            )}
            <History className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-600 font-semibold">
              Submission history
            </span>
            <span className="font-mono text-[10px] tracking-wider text-stone-400 tabular-nums">
              · {history.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {pendingCount > 0 && (
              <Pill tone="amber" label={`${pendingCount} pending`} />
            )}
            {changesCount > 0 && <Pill tone="red" label={`${changesCount} changes`} />}
            {approvedCount > 0 && (
              <Pill tone="emerald" label={`${approvedCount} approved`} />
            )}
          </div>
        </button>

        {open && (
          <ol className="pb-3 space-y-2">
            {visible.map((entry, idx) => (
              <HistoryItem key={entry.id} entry={entry} isFirst={idx === 0} />
            ))}
            {hidden > 0 && (
              <li className="text-[11px] text-stone-500 pl-6">
                +{hidden} earlier submission{hidden === 1 ? "" : "s"}
              </li>
            )}
          </ol>
        )}
      </div>
    </div>
  );
};

const Pill = ({ tone, label }: { tone: "amber" | "red" | "emerald"; label: string }) => (
  <span
    className={cn(
      "font-mono text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded border tabular-nums",
      tone === "amber" && "bg-amber-50 text-amber-700 border-amber-200",
      tone === "red" && "bg-red-50 text-red-700 border-red-200",
      tone === "emerald" && "bg-emerald-50 text-emerald-700 border-emerald-200",
    )}
  >
    {label}
  </span>
);

const HistoryItem = ({
  entry,
  isFirst,
}: {
  entry: SubmissionRecord;
  isFirst: boolean;
}) => {
  const decisionMeta = entry.decision
    ? entry.decision === "approved"
      ? {
          icon: CheckCircle2,
          color: "text-emerald-600",
          bg: "bg-emerald-50 border-emerald-200",
          label: "Approved",
        }
      : {
          icon: MessageSquareWarning,
          color: "text-red-600",
          bg: "bg-red-50 border-red-200",
          label: "Changes requested",
        }
    : {
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200",
        label: "Pending review",
      };

  const Icon = decisionMeta.icon;

  return (
    <li
      className={cn(
        "rounded-lg border bg-white p-3 text-[12.5px]",
        isFirst ? "border-stone-300 shadow-sm" : "border-stone-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={cn(
              "h-7 w-7 rounded-md border flex items-center justify-center flex-shrink-0",
              decisionMeta.bg,
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", decisionMeta.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-900">
                {decisionMeta.label}
              </span>
              {entry.versionLabel && (
                <span className="font-mono text-[9px] tracking-wider uppercase text-stone-500 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                  {entry.versionLabel}
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-stone-500 mt-0.5 inline-flex items-center gap-1.5">
              <Send className="h-3 w-3" aria-hidden="true" />
              <span
                className="h-3.5 w-3.5 rounded-full text-[7px] font-semibold text-white inline-flex items-center justify-center"
                style={{ backgroundColor: getAvatarColor(entry.submittedById) }}
                aria-hidden="true"
              >
                {getInitials(entry.submittedByName, 1)}
              </span>
              <span className="font-medium text-stone-700">{entry.submittedByName}</span>
              <span className="text-stone-400">·</span>
              <time
                dateTime={entry.submittedAt}
                title={fullDateTime(entry.submittedAt)}
                className="font-mono tabular-nums"
              >
                {relativeTime(entry.submittedAt)}
              </time>
            </p>
          </div>
        </div>
      </div>

      {entry.submissionNote && (
        <p className="mt-2 ml-9 text-[12px] text-stone-600 italic leading-snug">
          "{entry.submissionNote}"
        </p>
      )}

      {entry.decision && entry.decidedByName && (
        <div className="mt-2 ml-9 pl-3 border-l-2 border-stone-200">
          <p className="text-[11.5px] text-stone-500 inline-flex items-center gap-1.5">
            <span
              className="h-3.5 w-3.5 rounded-full text-[7px] font-semibold text-white inline-flex items-center justify-center"
              style={{ backgroundColor: getAvatarColor(entry.decidedById ?? "") }}
              aria-hidden="true"
            >
              {getInitials(entry.decidedByName, 1)}
            </span>
            <span className="font-medium text-stone-700">{entry.decidedByName}</span>
            {entry.decidedAt && (
              <>
                <span className="text-stone-400">·</span>
                <time
                  dateTime={entry.decidedAt}
                  title={fullDateTime(entry.decidedAt)}
                  className="font-mono tabular-nums"
                >
                  {relativeTime(entry.decidedAt)}
                </time>
              </>
            )}
          </p>
          {entry.decisionNote && (
            <p className="mt-1 text-[12px] text-stone-700 leading-snug">
              {entry.decisionNote}
            </p>
          )}
        </div>
      )}
    </li>
  );
};
