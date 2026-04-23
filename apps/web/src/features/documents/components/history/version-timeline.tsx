import {
  Pencil,
  Bot,
  Send,
  CheckCircle2,
  Shield,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeTime, fullDateTime, getInitials, getAvatarColor } from "@/lib/format";
import { REASON_META, type DocumentVersion, type VersionReason } from "@/api/adapters/documents";

interface VersionTimelineProps {
  versions: DocumentVersion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  canRestore: boolean;
  onRestore: (id: string) => void;
  currentVersionId: string | null;
}

const REASON_ICON: Record<VersionReason, React.ComponentType<{ className?: string }>> = {
  manual: Pencil,
  auto: Bot,
  submitted: Send,
  approved: CheckCircle2,
  before_restore: Shield,
};

const TONE_BG: Record<string, string> = {
  blue: "bg-sky-50 border-sky-200 text-sky-700",
  neutral: "bg-stone-50 border-stone-200 text-stone-600",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  stone: "bg-stone-100 border-stone-300 text-stone-700",
};

export const VersionTimeline = ({
  versions,
  selectedId,
  onSelect,
  canRestore,
  onRestore,
  currentVersionId,
}: VersionTimelineProps) => {
  return (
    <ol className="relative">
      <span
        className="absolute left-[19px] top-2 bottom-2 w-px bg-stone-200"
        aria-hidden="true"
      />
      {versions.map((v) => {
        const meta = REASON_META[v.reason];
        const Icon = REASON_ICON[v.reason];
        const isSelected = v.id === selectedId;
        const isCurrent = v.id === currentVersionId;
        return (
          <li key={v.id} className="relative pl-12 pr-3 py-2.5">
            <button
              type="button"
              onClick={() => onSelect(v.id)}
              className={cn(
                "w-full text-left rounded-xl border transition-all duration-150 flex items-start gap-3 p-3",
                isSelected
                  ? "border-stone-400 bg-white shadow-sm ring-1 ring-stone-200"
                  : "border-stone-200 bg-white/60 hover:bg-white hover:border-stone-300",
              )}
              aria-current={isSelected ? "true" : undefined}
            >
              <span className="sr-only">Version {v.versionNumber}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border",
                      TONE_BG[meta.tone],
                    )}
                  >
                    {meta.label}
                  </span>
                  {v.versionLabel && (
                    <span className="font-mono text-[10px] tracking-wider uppercase text-stone-500 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                      {v.versionLabel}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="font-mono text-[10px] tracking-wider uppercase text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                      Current
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[10px] text-stone-400 tabular-nums">
                    #{v.versionNumber}
                  </span>
                </div>
                <p className="text-[12.5px] text-stone-700 mt-1.5 inline-flex items-center gap-1.5 flex-wrap">
                  <span
                    className="h-3.5 w-3.5 rounded-full text-[7px] font-semibold text-white inline-flex items-center justify-center"
                    style={{ backgroundColor: getAvatarColor(v.createdById) }}
                    aria-hidden="true"
                  >
                    {getInitials(v.createdByName, 1)}
                  </span>
                  <span className="font-medium">{v.createdByName}</span>
                  <span className="text-stone-400">·</span>
                  <time
                    dateTime={v.createdAt}
                    title={fullDateTime(v.createdAt)}
                    className="font-mono text-[11px] text-stone-500 tabular-nums"
                  >
                    {relativeTime(v.createdAt)}
                  </time>
                </p>
                {v.note && (
                  <p className="mt-1.5 text-[12px] text-stone-500 italic leading-snug line-clamp-2">
                    "{v.note}"
                  </p>
                )}
                {isSelected && canRestore && !isCurrent && (
                  <div className="mt-2.5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(v.id);
                      }}
                      className="h-7 px-2.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore this version
                    </button>
                  </div>
                )}
              </div>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-stone-300 mt-1 flex-shrink-0 transition-transform",
                  isSelected && "rotate-90 text-stone-500",
                )}
                aria-hidden="true"
              />
            </button>

            {/* Marker */}
            <span
              className={cn(
                "absolute left-2.5 top-5 h-7 w-7 rounded-full border-2 flex items-center justify-center bg-white",
                TONE_BG[meta.tone],
              )}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          </li>
        );
      })}
    </ol>
  );
};
