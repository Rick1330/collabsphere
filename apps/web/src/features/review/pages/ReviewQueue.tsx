/**
 * Review Queue page.
 *
 * Cross-workspace queue of pending submissions for supervisors / reviewers /
 * platform admins. Supports search + sort, inline approve / request-changes
 * with note validation, and a per-document decision history panel.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHotkey } from "@/hooks/use-hotkey";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ClipboardCheck,
  ExternalLink,
  GraduationCap,
  History,
  Loader2,
  MessageSquareWarning,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/app/shell/app-sidebar";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useCurrentAccount } from "@/lib/auth-session";
import { getSessionRole } from "@/lib/session-role";
import { fullDateTime, getAvatarColor, getInitials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  decideOnSubmission,
  fetchDocumentHistory,
  fetchReviewQueue,
  type ReviewDecision,
  type ReviewItem,
  type ReviewedItem,
} from "@/api/adapters/review";
import type { SubmissionRecord } from "@/lib/mock-academic";

const ReviewQueuePage = () => {
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
  const account = useCurrentAccount();
  const sessionRole = getSessionRole(account);

  useEffect(() => {
    document.title = "Review queue — CollabSphere";
  }, []);

  if (account && !sessionRole.canReview) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-light min-h-screen flex">
      <AppSidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav unreadCount={3} onOpenPalette={palette.toggle} />
        <ReviewQueueBody />
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default ReviewQueuePage;

type SortKey = "newest" | "oldest" | "title" | "workspace";

const ReviewQueueBody = () => {
  const query = useQuery({
    queryKey: ["review-queue"],
    queryFn: fetchReviewQueue,
  });

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "academic", label: "Academic" },
    { key: "professional", label: "Professional" },
  ] as const;
  const [filter, setFilter] = useState<(typeof filterTabs)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("oldest");
  const searchRef = useRef<HTMLInputElement>(null);
  const [focusedIdx, setFocusedIdx] = useState(0);

  const pending = useMemo(() => {
    let list = query.data?.pending ?? [];
    if (filter !== "all") list = list.filter((p) => p.workspaceType === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.documentTitle.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q) ||
          p.workspaceName.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "newest")
        return new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime();
      if (sort === "oldest")
        return new Date(a.lastEventAt).getTime() - new Date(b.lastEventAt).getTime();
      if (sort === "title") return a.documentTitle.localeCompare(b.documentTitle);
      return a.workspaceName.localeCompare(b.workspaceName);
    });
    return sorted;
  }, [query.data, filter, search, sort]);

  const reviewed = query.data?.reviewed ?? [];
  const overdueCount = pending.filter(
    (p) => Date.now() - new Date(p.lastEventAt).getTime() > 24 * 60 * 60 * 1000,
  ).length;

  // Reset focus when the visible set changes.
  useEffect(() => {
    setFocusedIdx((i) => Math.min(i, Math.max(0, pending.length - 1)));
  }, [pending.length]);

  const scrollRowIntoView = (idx: number) => {
    const el = document.querySelector<HTMLElement>(`[data-review-row="${idx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Context shortcuts: focus search, jump between rows.
  useHotkey("/", () => {
    searchRef.current?.focus();
    searchRef.current?.select();
  });
  useHotkey("j", () => {
    if (pending.length === 0) return;
    setFocusedIdx((i) => {
      const next = Math.min(pending.length - 1, i + 1);
      scrollRowIntoView(next);
      return next;
    });
  });
  useHotkey("k", () => {
    if (pending.length === 0) return;
    setFocusedIdx((i) => {
      const next = Math.max(0, i - 1);
      scrollRowIntoView(next);
      return next;
    });
  });

  // Approve / request-changes the focused row. We dispatch a window event
  // keyed to the focused submission's documentId so the row component owns
  // the actual mutation + validation logic. The hook's modal guard prevents
  // these from firing while the inline note dialog is already open.
  const dispatchDecision = (decision: "approved" | "changes_requested") => {
    if (pending.length === 0) return;
    const item = pending[focusedIdx];
    if (!item) return;
    window.dispatchEvent(
      new CustomEvent("cs:review:start-decision", {
        detail: { documentId: item.documentId, decision },
      }),
    );
  };
  useHotkey("a", () => dispatchDecision("approved"));
  useHotkey("r", () => dispatchDecision("changes_requested"));

  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-6xl mx-auto w-full">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-amber-700 font-semibold inline-flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Reviewer
          </p>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1">
            Review queue
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Approve work or request changes. Items wait here until you decide.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <strong className="font-mono tabular-nums text-stone-900">
              {pending.length}
            </strong>
            pending
          </span>
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              <strong className="font-mono tabular-nums text-red-700">
                {overdueCount}
              </strong>
              overdue
            </span>
          )}
        </div>
      </header>

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter by workspace type"
        className="flex items-center gap-1 mb-4 border-b border-stone-200"
      >
        {filterTabs.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setFilter(t.key)}
              className={cn(
                "h-9 px-3 text-xs font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-stone-500 hover:text-stone-900",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document, author, or workspace…"
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-300"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 inline-flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-stone-500">
          <span className="font-mono uppercase tracking-wider text-[10px]">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 px-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-300"
          >
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
            <option value="title">Document title</option>
            <option value="workspace">Workspace</option>
          </select>
        </label>
      </div>

      {/* Pending */}
      <section aria-labelledby="pending-heading" className="mb-10">
        <h2 id="pending-heading" className="sr-only">
          Pending submissions
        </h2>

        {query.isLoading && (
          <ul className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="rounded-xl border border-stone-200 bg-white p-4">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </li>
            ))}
          </ul>
        )}

        {query.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-800">
            Failed to load the queue.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => query.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {query.isSuccess && pending.length === 0 && (
          <div className="rounded-xl border border-stone-200 bg-white py-12 text-center">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-stone-900 mt-3">
              {search ? "No matches" : "You're all caught up"}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {search
                ? "Try a different search term or clear filters."
                : "Nothing is waiting on your decision right now."}
            </p>
          </div>
        )}

        {query.isSuccess && pending.length > 0 && (
          <ul className="space-y-2">
            {pending.map((item, idx) => (
              <PendingRow
                key={item.documentId}
                item={item}
                index={idx}
                isFocused={idx === focusedIdx}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Recently reviewed */}
      {reviewed.length > 0 && (
        <section aria-labelledby="reviewed-heading">
          <h2
            id="reviewed-heading"
            className="text-sm font-semibold text-stone-900 mb-3 inline-flex items-center gap-2"
          >
            Recently decided
            <span className="font-mono text-[10px] text-stone-400 tabular-nums">
              {reviewed.length}
            </span>
          </h2>
          <ul className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100 overflow-hidden">
            {reviewed.slice(0, 8).map((item) => (
              <ReviewedRow key={item.documentId + item.decidedAt} item={item} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
};

const PendingRow = ({
  item,
  index,
  isFocused,
}: {
  item: ReviewItem;
  index?: number;
  isFocused?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<ReviewDecision | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const isOverdue = Date.now() - new Date(item.lastEventAt).getTime() > 24 * 60 * 60 * 1000;
  const docHref = `/w/${item.workspaceId}/documents/${item.documentId}`;

  const mutation = useMutation({
    mutationFn: () =>
      decideOnSubmission({
        documentId: item.documentId,
        decision: pendingDecision!,
        note: note.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success(
        result.decision === "approved"
          ? `Approved · ${result.documentTitle}`
          : `Changes requested · ${result.documentTitle}`,
      );
      setOpen(false);
      setNote("");
      setNoteError(null);
      setPendingDecision(null);
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["review-counts"] });
      queryClient.invalidateQueries({ queryKey: ["doc-history", item.documentId] });
    },
    onError: () => {
      toast.error("Could not record your decision.");
    },
  });

  const startDecision = (d: ReviewDecision) => {
    setPendingDecision(d);
    setOpen(true);
    setNoteError(null);
    setNote("");
  };

  // Listen for keyboard-driven decisions (a / r). The parent dispatches a
  // documentId-scoped event so only the matching row reacts, and we ignore
  // it when the row is already in note-entry mode.
  useEffect(() => {
    const onDecision = (e: Event) => {
      const detail = (e as CustomEvent<{ documentId: string; decision: ReviewDecision }>).detail;
      if (!detail || detail.documentId !== item.documentId) return;
      if (open) return; // already deciding — leave as-is
      startDecision(detail.decision);
    };
    window.addEventListener("cs:review:start-decision", onDecision);
    return () => window.removeEventListener("cs:review:start-decision", onDecision);
  }, [item.documentId, open]);

  const validateAndSubmit = () => {
    const trimmed = note.trim();
    if (pendingDecision === "changes_requested") {
      if (trimmed.length === 0) {
        setNoteError("A note is required when requesting changes.");
        return;
      }
      if (trimmed.length < 10) {
        setNoteError("Please be specific — at least 10 characters.");
        return;
      }
    }
    if (pendingDecision === "approved" && trimmed.length > 0 && trimmed.length < 3) {
      setNoteError("Note is too short. Leave blank or add a real comment.");
      return;
    }
    setNoteError(null);
    mutation.mutate();
  };

  return (
    <li
      data-review-row={index}
      className={cn(
        "rounded-xl border bg-white overflow-hidden transition-shadow",
        isFocused
          ? "border-teal-400 shadow-[0_0_0_3px_rgba(13,148,136,0.12)]"
          : "border-stone-200",
      )}
    >
      <div className="p-4 flex items-start gap-3">
        <span
          className="h-9 w-9 rounded-full text-[11px] font-semibold text-white inline-flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: getAvatarColor(item.studentId) }}
          aria-hidden
        >
          {getInitials(item.studentName, 1)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={docHref}
              className="text-sm font-semibold text-stone-900 hover:text-teal-700 transition-colors inline-flex items-center gap-1.5"
            >
              {item.documentTitle}
              <ExternalLink className="h-3 w-3 text-stone-400" />
            </Link>
            {item.versionLabel && (
              <span className="font-mono text-[10px] text-stone-500 tracking-wider px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50">
                {item.versionLabel}
              </span>
            )}
            <span
              className={cn(
                "font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border inline-flex items-center gap-1",
                item.workspaceType === "academic"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-teal-50 text-teal-700 border-teal-200",
              )}
            >
              {item.workspaceType === "academic" && <GraduationCap className="h-2.5 w-2.5" />}
              {item.workspaceName}
            </span>
          </div>
          <p className="text-[12.5px] text-stone-500 mt-1">
            <span className="font-medium text-stone-700">{item.studentName}</span>
            {item.folderPath && <span className="text-stone-400"> · {item.folderPath}</span>}
          </p>
          {item.submissionNote && (
            <p className="text-[12.5px] text-stone-600 mt-2 italic line-clamp-2">
              "{item.submissionNote}"
            </p>
          )}
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            {historyOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <History className="h-3 w-3" />
            {historyOpen ? "Hide" : "Show"} decision history
          </button>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span
            className={cn(
              "font-mono text-[10px] tabular-nums tracking-wider inline-flex items-center gap-1",
              isOverdue ? "text-red-600 font-semibold" : "text-stone-400",
            )}
            title={fullDateTime(item.lastEventAt)}
          >
            {isOverdue && <AlertCircle className="h-3 w-3" />}
            {relativeTime(item.lastEventAt)}
          </span>
        </div>
      </div>

      {historyOpen && <DecisionHistory documentId={item.documentId} />}

      {!open && (
        <div className="px-4 pb-4 flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => startDecision("changes_requested")}
            className="h-8 px-3 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 transition-colors"
          >
            <MessageSquareWarning className="h-3.5 w-3.5" />
            Request changes
          </button>
          <button
            type="button"
            onClick={() => startDecision("approved")}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </button>
        </div>
      )}

      {open && pendingDecision && (
        <div className="px-4 pb-4 border-t border-stone-100 pt-3 bg-stone-50/30">
          <label
            htmlFor={`note-${item.documentId}`}
            className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-1.5"
          >
            {pendingDecision === "approved"
              ? "Optional approval note"
              : "What needs to change?"}
            {pendingDecision === "changes_requested" && (
              <span className="text-red-600 ml-1">*</span>
            )}
          </label>
          <textarea
            id={`note-${item.documentId}`}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (noteError) setNoteError(null);
            }}
            rows={3}
            aria-invalid={!!noteError}
            aria-describedby={noteError ? `note-err-${item.documentId}` : undefined}
            placeholder={
              pendingDecision === "approved"
                ? "Looks good — clear rationale. (optional)"
                : "Be specific so the author can act on this."
            }
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 resize-none",
              noteError
                ? "border-red-300 focus:ring-red-500/30 focus:border-red-400"
                : "border-stone-200 focus:ring-teal-500/40 focus:border-teal-300",
            )}
          />
          {noteError && (
            <p
              id={`note-err-${item.documentId}`}
              role="alert"
              className="mt-1.5 text-[12px] text-red-700 inline-flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {noteError}
            </p>
          )}
          <div className="flex items-center gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setPendingDecision(null);
                setNote("");
                setNoteError(null);
              }}
              className="h-8 px-3 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 inline-flex items-center gap-1.5 transition-colors"
              disabled={mutation.isPending}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={validateAndSubmit}
              disabled={mutation.isPending}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors shadow-sm",
                pendingDecision === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {mutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : pendingDecision === "approved" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <MessageSquareWarning className="h-3.5 w-3.5" />
              )}
              Confirm{" "}
              {pendingDecision === "approved" ? "approval" : "changes requested"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

const DecisionHistory = ({ documentId }: { documentId: string }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["doc-history", documentId],
    queryFn: () => fetchDocumentHistory(documentId),
  });

  return (
    <div className="px-4 pb-4 border-t border-stone-100 pt-3 bg-stone-50/40">
      <p className="text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-2">
        Decision history
      </p>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}
      {isError && (
        <p className="text-[12px] text-red-700">Could not load history.</p>
      )}
      {data && data.length === 0 && (
        <p className="text-[12px] text-stone-500 italic">
          No prior decisions — this is the first submission.
        </p>
      )}
      {data && data.length > 0 && (
        <ol className="relative ml-2 border-l border-stone-200 space-y-3 pl-4">
          {data.map((rec) => (
            <HistoryItem key={rec.id} record={rec} />
          ))}
        </ol>
      )}
    </div>
  );
};

const HistoryItem = ({ record }: { record: SubmissionRecord }) => {
  const decided = !!record.decision;
  const ok = record.decision === "approved";
  return (
    <li className="relative">
      <span
        className={cn(
          "absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white",
          !decided
            ? "bg-amber-500"
            : ok
              ? "bg-emerald-500"
              : "bg-red-500",
        )}
        aria-hidden
      />
      <div className="rounded-lg bg-white border border-stone-200 px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          {record.versionLabel && (
            <span className="font-mono text-[10px] text-stone-500 tracking-wider px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50">
              {record.versionLabel}
            </span>
          )}
          <span
            className={cn(
              "font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border",
              !decided
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : ok
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {!decided ? "PENDING" : ok ? "APPROVED" : "CHANGES"}
          </span>
          <span className="text-[11.5px] text-stone-500">
            Submitted by{" "}
            <span className="font-medium text-stone-700">{record.submittedByName}</span>
            {" · "}
            <time
              dateTime={record.submittedAt}
              title={fullDateTime(record.submittedAt)}
              className="font-mono tabular-nums"
            >
              {relativeTime(record.submittedAt)}
            </time>
          </span>
        </div>
        {record.submissionNote && (
          <p className="text-[12px] text-stone-600 italic mt-1.5">
            "{record.submissionNote}"
          </p>
        )}
        {decided && (
          <div className="mt-2 pt-2 border-t border-stone-100">
            <p className="text-[11.5px] text-stone-500">
              Decided by{" "}
              <span className="font-medium text-stone-700">
                {record.decidedByName ?? "Reviewer"}
              </span>
              {record.decidedAt && (
                <>
                  {" · "}
                  <time
                    dateTime={record.decidedAt}
                    title={fullDateTime(record.decidedAt)}
                    className="font-mono tabular-nums"
                  >
                    {relativeTime(record.decidedAt)}
                  </time>
                </>
              )}
            </p>
            {record.decisionNote && (
              <p className="text-[12px] text-stone-700 mt-1">
                "{record.decisionNote}"
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
};

const ReviewedRow = ({ item }: { item: ReviewedItem }) => {
  const docHref = `/w/${item.workspaceId}/documents/${item.documentId}`;
  const ok = item.decision === "approved";
  return (
    <li>
      <Link
        to={docHref}
        className="px-4 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors group"
      >
        <span
          className={cn(
            "h-7 w-7 rounded-full inline-flex items-center justify-center flex-shrink-0",
            ok
              ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
              : "bg-red-50 border border-red-200 text-red-600",
          )}
          aria-hidden
        >
          {ok ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <MessageSquareWarning className="h-3.5 w-3.5" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 truncate group-hover:text-teal-700 transition-colors">
            {item.documentTitle}
          </p>
          <p className="text-[11.5px] text-stone-500 truncate mt-0.5">
            {item.studentName} · {item.workspaceName}
          </p>
        </div>
        <span
          className={cn(
            "font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border flex-shrink-0",
            ok
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200",
          )}
        >
          {ok ? "APPROVED" : "CHANGES"}
        </span>
        <time
          dateTime={item.decidedAt}
          title={fullDateTime(item.decidedAt)}
          className="font-mono text-[10px] text-stone-400 tabular-nums tracking-wider hidden sm:inline-block flex-shrink-0"
        >
          {relativeTime(item.decidedAt)}
        </time>
      </Link>
    </li>
  );
};
