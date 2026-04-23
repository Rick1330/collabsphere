import { useState } from "react";
import { Check, CornerDownRight, MessageSquare, MoreHorizontal, RotateCcw } from "lucide-react";
import { getInitials, relativeTime } from "@/lib/format";
import { findMember, type CommentThread } from "@/lib/mock-comments";
import { cn } from "@/lib/utils";
import { DocumentCommentBody } from "./document-comment-body";
import { DocumentCommentComposer } from "./document-comment-composer";
import type { CommentNode } from "@/lib/mock-comments";

interface DocumentCommentThreadProps {
  thread: CommentThread;
  isActive: boolean;
  canResolve: boolean;
  canReply: boolean;
  onSelect: () => void;
  onJumpToAnchor?: () => void;
  onReply: (body: CommentNode[]) => void;
  onToggleResolve: () => void;
}

export const DocumentCommentThreadCard = ({
  thread,
  isActive,
  canResolve,
  canReply,
  onSelect,
  onJumpToAnchor,
  onReply,
  onToggleResolve,
}: DocumentCommentThreadProps) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const author = findMember(thread.authorId);
  const resolver = thread.resolvedBy ? findMember(thread.resolvedBy) : null;
  const replyCount = thread.replies.length;

  return (
    <article
      onClick={onSelect}
      className={cn(
        "group relative rounded-lg border bg-white transition-all cursor-pointer",
        isActive
          ? "border-teal-300 shadow-sm ring-1 ring-teal-200"
          : "border-stone-200 hover:border-stone-300",
      )}
      aria-current={isActive ? "true" : undefined}
    >
      {/* Anchor strip */}
      {thread.anchor && (
        <div className="flex items-start gap-2 px-3 pt-2.5 pb-1.5">
          <div
            className={cn(
              "flex-1 min-w-0 px-2 py-1 rounded text-[12px] leading-snug border-l-2 truncate",
              thread.anchor.status === "changed"
                ? "border-amber-400 bg-amber-50/60 text-amber-800"
                : "border-teal-400 bg-teal-50/60 text-teal-800",
            )}
          >
            <span className="opacity-70">"</span>
            {thread.anchor.snippet}
            <span className="opacity-70">"</span>
          </div>
          {onJumpToAnchor && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onJumpToAnchor();
              }}
              className="flex-shrink-0 text-[10px] font-mono tracking-wider uppercase text-stone-400 hover:text-teal-600 transition-colors px-1.5 py-1 rounded hover:bg-stone-50"
              aria-label="Jump to anchor in document"
            >
              Jump
            </button>
          )}
        </div>
      )}
      {thread.anchor?.status === "changed" && (
        <p className="px-3 pb-1 text-[10px] font-mono tracking-wider uppercase text-amber-600">
          Text changed since comment
        </p>
      )}

      {/* Author row */}
      <div className="flex items-start gap-2.5 px-3 pt-2 pb-1">
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: author?.color ?? "#A8A29E" }}
        >
          {getInitials(author?.fullName ?? "?", 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-stone-900 truncate">
              {author?.fullName ?? "Unknown"}
            </span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400 flex-shrink-0">
              {relativeTime(thread.createdAt)}
            </span>
          </div>
          <div className="mt-0.5">
            <DocumentCommentBody body={thread.body} />
          </div>
        </div>
      </div>

      {/* Replies */}
      {replyCount > 0 && (
        <ul className="pl-10 pr-3 pb-1 space-y-2">
          {thread.replies.map((reply) => {
            const ra = findMember(reply.authorId);
            return (
              <li key={reply.id} className="flex items-start gap-2">
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 mt-px"
                  style={{ backgroundColor: ra?.color ?? "#A8A29E" }}
                >
                  {getInitials(ra?.fullName ?? "?", 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-800 truncate">
                      {ra?.fullName ?? "Unknown"}
                    </span>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400 flex-shrink-0">
                      {relativeTime(reply.createdAt)}
                    </span>
                  </div>
                  <div className="mt-0.5">
                    <DocumentCommentBody body={reply.body} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-t border-stone-100">
        <div className="flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase text-stone-400">
          <MessageSquare className="h-3 w-3" aria-hidden="true" />
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
          {thread.resolved && resolver && (
            <span className="ml-1.5 text-emerald-600">
              · resolved by {resolver.fullName.split(" ")[0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {canReply && !thread.resolved && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setReplyOpen((v) => !v);
                onSelect();
              }}
              className="h-6 px-2 rounded-md text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors flex items-center gap-1"
            >
              <CornerDownRight className="h-3 w-3" aria-hidden="true" />
              Reply
            </button>
          )}
          {canResolve && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleResolve();
              }}
              className={cn(
                "h-6 px-2 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1",
                thread.resolved
                  ? "text-amber-600 hover:bg-amber-50"
                  : "text-emerald-600 hover:bg-emerald-50",
              )}
              aria-label={thread.resolved ? "Reopen thread" : "Resolve thread"}
            >
              {thread.resolved ? (
                <>
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Reopen
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Resolve
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {replyOpen && canReply && !thread.resolved && (
        <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
          <DocumentCommentComposer
            placeholder="Reply…"
            submitLabel="Reply"
            size="sm"
            autoFocus
            onSubmit={(body) => {
              onReply(body);
              setReplyOpen(false);
            }}
            onCancel={() => setReplyOpen(false)}
          />
        </div>
      )}
    </article>
  );
};
