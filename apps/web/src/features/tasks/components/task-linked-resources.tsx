import { Link as LinkIcon, ExternalLink, Copy, AlertTriangle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TaskLinkedResource } from "@/api/adapters/tasks";

interface Props {
  workspaceId: string;
  resources: TaskLinkedResource[];
  canManage: boolean;
  onUnlink?: (id: string) => void;
}

export const TaskLinkedResources = ({
  workspaceId,
  resources,
  canManage,
  onUnlink,
}: Props) => {
  if (resources.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/40 px-3 py-3 text-[12px] text-stone-400 italic flex items-center gap-2">
        <LinkIcon className="h-3.5 w-3.5" />
        No linked documents.
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {resources.map((r) => {
        const url = `/w/${workspaceId}/documents/${r.documentId}${
          r.anchor ? `#anchor=${encodeURIComponent(r.anchor.snippet)}` : ""
        }`;
        const broken = r.anchor?.status === "changed";
        return (
          <li
            key={r.id}
            className="group rounded-lg border border-stone-200 bg-white px-3 py-2.5 hover:border-stone-300 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span
                className="text-base leading-none mt-0.5"
                aria-hidden="true"
              >
                {r.documentIcon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[13px] font-semibold text-stone-900 truncate">
                    {r.documentTitle}
                  </span>
                  {broken && (
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200"
                      title="The linked text was changed in the source document"
                    >
                      <AlertTriangle className="h-2.5 w-2.5" /> Source changed
                    </span>
                  )}
                </div>
                {r.anchor && (
                  <p
                    className={cn(
                      "text-[12px] mt-1 leading-snug border-l-2 pl-2 italic",
                      broken
                        ? "border-amber-300 text-stone-400"
                        : "border-stone-200 text-stone-500",
                    )}
                  >
                    "{r.anchor.snippet}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(window.location.origin + url)
                      .then(() => toast.success("Link copied"));
                  }}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label={`Copy link to ${r.documentTitle}`}
                  title="Copy link"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <Link
                  to={url}
                  className="h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                  aria-label={`Open ${r.documentTitle}`}
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </Link>
                {canManage && onUnlink && (
                  <button
                    type="button"
                    onClick={() => onUnlink(r.id)}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label={`Unlink ${r.documentTitle}`}
                    title="Unlink"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
