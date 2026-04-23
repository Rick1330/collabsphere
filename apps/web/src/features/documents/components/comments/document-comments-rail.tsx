import { useEffect, useRef } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentNode, CommentThread } from "@/lib/mock-comments";
import type { CommentFilter } from "@/features/documents/hooks/use-document-comments";
import { DocumentCommentComposer } from "./document-comment-composer";
import { DocumentCommentThreadCard } from "./document-comment-thread";
import { DocumentThreadFilters } from "./document-thread-filters";

interface DocumentCommentsRailProps {
  threads: CommentThread[];
  filter: CommentFilter;
  openCount: number;
  resolvedCount: number;
  activeThreadId: string | null;
  canComment: boolean;
  canResolve: boolean;
  onFilterChange: (f: CommentFilter) => void;
  onCreate: (body: CommentNode[]) => void;
  onReply: (threadId: string, body: CommentNode[]) => void;
  onToggleResolve: (threadId: string) => void;
  onSelectThread: (threadId: string | null) => void;
  onJumpToAnchor: (threadId: string) => void;
  onClose?: () => void;
}

export const DocumentCommentsRail = ({
  threads,
  filter,
  openCount,
  resolvedCount,
  activeThreadId,
  canComment,
  canResolve,
  onFilterChange,
  onCreate,
  onReply,
  onToggleResolve,
  onSelectThread,
  onJumpToAnchor,
  onClose,
}: DocumentCommentsRailProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active thread
  useEffect(() => {
    if (!activeThreadId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-thread-id="${activeThreadId}"]`);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeThreadId]);

  return (
    <aside
      aria-label="Document comments"
      className="flex flex-col h-full bg-white border-l border-stone-200 min-w-0"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2 border-b border-stone-200 flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-stone-900 tracking-tight">Comments</h2>
          <p className="font-mono text-[10px] text-stone-400 tracking-wider uppercase mt-0.5">
            {openCount === 0
              ? "No open threads"
              : `${openCount} open ${openCount === 1 ? "thread" : "threads"}`}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close comments"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-4 py-2 border-b border-stone-100 flex-shrink-0">
        <DocumentThreadFilters
          filter={filter}
          openCount={openCount}
          resolvedCount={resolvedCount}
          onChange={onFilterChange}
        />
      </div>

      {/* Composer (only when looking at open threads + can comment) */}
      {filter === "open" && canComment && (
        <div className="px-4 py-3 border-b border-stone-100 flex-shrink-0">
          <DocumentCommentComposer
            placeholder="Start a general document discussion…"
            submitLabel="Post"
            onSubmit={onCreate}
          />
        </div>
      )}

      {/* Thread list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {threads.length === 0 ? (
          <RailEmptyState filter={filter} canComment={canComment} />
        ) : (
          threads.map((t) => (
            <div key={t.id} data-thread-id={t.id}>
              <DocumentCommentThreadCard
                thread={t}
                isActive={t.id === activeThreadId}
                canResolve={canResolve}
                canReply={canComment}
                onSelect={() => onSelectThread(t.id === activeThreadId ? null : t.id)}
                onJumpToAnchor={t.anchor ? () => onJumpToAnchor(t.id) : undefined}
                onReply={(body) => onReply(t.id, body)}
                onToggleResolve={() => onToggleResolve(t.id)}
              />
            </div>
          ))
        )}
      </div>

      {!canComment && filter === "open" && (
        <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50/60 text-[11px] text-stone-500">
          You have view-only access. You can read threads but not post replies.
        </div>
      )}
    </aside>
  );
};

const RailEmptyState = ({
  filter,
  canComment,
}: {
  filter: CommentFilter;
  canComment: boolean;
}) => {
  if (filter === "resolved") {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-sm text-stone-500">No resolved threads yet.</p>
        <p className="text-[11px] text-stone-400 mt-1">
          Resolved discussions will appear here for reference.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center py-10 px-4">
      <div className="h-10 w-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto">
        <MessageSquarePlus className="h-4 w-4 text-teal-600" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-stone-900 mt-3">No comments yet</h3>
      <p className="text-[12px] text-stone-500 mt-1.5 leading-relaxed">
        {canComment ? (
          <>
            Select text in the document to leave an
            <br />
            inline comment, or start a general thread above.
          </>
        ) : (
          "No discussion has started on this document yet."
        )}
      </p>
    </div>
  );
};
