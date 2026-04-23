/**
 * Role-specific dashboard panels.
 *
 * The dashboard greets every user, but the most useful payload differs by
 * role. These panels are dropped into `DashboardContent` based on the
 * effective session role:
 *
 *   - admin       → Platform admin shortcut (links to /admin)
 *   - supervisor  → "Awaiting your review" preview + jump to /review
 *   - student     → "My submissions" status (pending decisions + recent)
 *   - viewer      → Read-only banner explaining what they can/can't do
 *   - owner / manager / member → no panel; default workspace cards
 *
 * Each panel is intentionally compact so the dashboard's main grid still
 * leads with workspaces. Data comes from the review adapter so the
 * supervisor and student panels are coherent with the /review page.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareWarning,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fullDateTime, getAvatarColor, getInitials, relativeTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentAccount } from "@/lib/auth-session";
import { getSessionRole, type SessionRole } from "@/lib/session-role";
import { fetchMySubmissions, fetchReviewCounts, fetchReviewQueue } from "@/api/adapters/review";

interface RolePanelProps {
  sessionRole: SessionRole;
}

export const RolePanel = ({ sessionRole }: RolePanelProps) => {
  if (sessionRole.role === "admin") return <AdminPanel />;
  if (sessionRole.role === "supervisor") return <SupervisorPanel />;
  if (sessionRole.role === "student") return <StudentPanel />;
  if (sessionRole.role === "viewer") return <ViewerPanel />;
  return null;
};

/* ----------------------------------------------------------------- */
/* Admin                                                             */
/* ----------------------------------------------------------------- */

const AdminPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["review-counts"],
    queryFn: fetchReviewCounts,
    refetchInterval: 30_000,
  });

  return (
    <section
      aria-label="Platform admin"
      className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50/60 to-white p-5 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-red-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-red-700 font-semibold">
            Platform admin
          </p>
          <h2 className="text-base font-semibold text-stone-900 mt-1">
            You have access to the admin console
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Manage users, workspaces, audit events, and platform health.
          </p>

          <dl className="mt-3 grid grid-cols-3 gap-2 max-w-md">
            <AdminStat
              label="Pending"
              value={data?.pendingTotal}
              loading={isLoading}
              tone="amber"
            />
            <AdminStat
              label="Overdue"
              value={data?.overdueTotal}
              loading={isLoading}
              tone="red"
            />
            <AdminStat
              label="Decided 24h"
              value={data?.decidedToday}
              loading={isLoading}
              tone="emerald"
            />
          </dl>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Link
              to="/admin"
              className="h-9 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              Open admin console
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/admin/users"
              className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors"
            >
              Users
            </Link>
            <Link
              to="/admin/audit"
              className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors"
            >
              Audit log
            </Link>
            <Link
              to="/review"
              className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors"
            >
              Review queue
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const AdminStat = ({
  label,
  value,
  loading,
  tone,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  tone: "amber" | "red" | "emerald";
}) => {
  const toneCls =
    tone === "amber"
      ? "text-amber-700"
      : tone === "red"
        ? "text-red-700"
        : "text-emerald-700";
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
        {label}
      </dt>
      <dd className={cn("font-mono tabular-nums text-lg font-semibold mt-0.5", toneCls)}>
        {loading ? <Skeleton className="h-5 w-8" /> : (value ?? 0)}
      </dd>
    </div>
  );
};

/* ----------------------------------------------------------------- */
/* Supervisor                                                        */
/* ----------------------------------------------------------------- */

const SupervisorPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: fetchReviewQueue,
  });

  const pending = data?.pending ?? [];
  const top = pending.slice(0, 3);

  return (
    <section
      aria-label="Awaiting your review"
      className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/40 to-white p-5 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
          <ClipboardCheck className="h-5 w-5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-amber-700 font-semibold">
                Reviewer
              </p>
              <h2 className="text-base font-semibold text-stone-900 mt-1">
                {isLoading
                  ? "Loading review queue…"
                  : pending.length === 0
                    ? "You're all caught up"
                    : `${pending.length} submission${pending.length === 1 ? "" : "s"} awaiting your review`}
              </h2>
            </div>
            <Link
              to="/review"
              className="h-9 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
            >
              Open queue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : top.length === 0 ? (
            <p className="text-sm text-stone-500 mt-2 inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Nothing pending right now.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white overflow-hidden">
              {top.map((item) => (
                <li key={item.documentId}>
                  <Link
                    to="/review"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 transition-colors group"
                  >
                    <span
                      className="h-7 w-7 rounded-full text-[10px] font-semibold text-white inline-flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: getAvatarColor(item.studentId) }}
                      aria-hidden
                    >
                      {getInitials(item.studentName, 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-stone-900 truncate group-hover:text-amber-700">
                        {item.documentTitle}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {item.studentName} · {item.workspaceName}
                      </p>
                    </div>
                    <time
                      dateTime={item.lastEventAt}
                      title={fullDateTime(item.lastEventAt)}
                      className="font-mono text-[10px] text-stone-400 tabular-nums tracking-wider flex-shrink-0"
                    >
                      {relativeTime(item.lastEventAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

/* ----------------------------------------------------------------- */
/* Student                                                           */
/* ----------------------------------------------------------------- */

const StudentPanel = () => {
  const account = useCurrentAccount();
  const { data, isLoading } = useQuery({
    queryKey: ["my-submissions", account?.id],
    queryFn: () => fetchMySubmissions(account!.id),
    enabled: !!account,
  });

  const pending = data?.pending ?? [];
  const reviewed = data?.reviewed ?? [];

  const recentDecision = reviewed[0];

  return (
    <section
      aria-label="My submissions"
      className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/40 to-white p-5 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-5 w-5 text-teal-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-teal-700 font-semibold">
            Student
          </p>
          <h2 className="text-base font-semibold text-stone-900 mt-1">
            {isLoading
              ? "Checking your submissions…"
              : pending.length === 0 && reviewed.length === 0
                ? "No submissions yet"
                : pending.length > 0
                  ? `${pending.length} submission${pending.length === 1 ? "" : "s"} awaiting review`
                  : "All caught up — no work pending decision"}
          </h2>

          {!isLoading && pending.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {pending.map((item) => (
                <li
                  key={item.documentId}
                  className="rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 flex items-center gap-3"
                >
                  <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-stone-900 truncate">
                      {item.documentTitle}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Submitted{" "}
                      <time dateTime={item.lastEventAt} title={fullDateTime(item.lastEventAt)}>
                        {relativeTime(item.lastEventAt)}
                      </time>{" "}
                      · waiting on supervisor
                    </p>
                  </div>
                  <Link
                    to={`/w/${item.workspaceId}/documents/${item.documentId}`}
                    className="text-[11px] font-medium text-teal-700 hover:text-teal-800 flex-shrink-0"
                  >
                    Open →
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && recentDecision && (
            <div
              className={cn(
                "mt-3 rounded-lg border px-3 py-2.5 flex items-start gap-3",
                recentDecision.decision === "approved"
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-red-200 bg-red-50/40",
              )}
            >
              {recentDecision.decision === "approved" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <MessageSquareWarning className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-stone-900">
                  {recentDecision.decision === "approved"
                    ? "Approved"
                    : "Changes requested"}
                  : <span className="text-stone-700">{recentDecision.documentTitle}</span>
                </p>
                {recentDecision.decisionNote && (
                  <p className="text-[12px] text-stone-600 mt-1 italic">
                    "{recentDecision.decisionNote}"
                  </p>
                )}
                <Link
                  to={`/w/${recentDecision.workspaceId}/documents/${recentDecision.documentId}`}
                  className="text-[11px] font-medium text-teal-700 hover:text-teal-800 mt-1 inline-block"
                >
                  Open document →
                </Link>
              </div>
            </div>
          )}

          {!isLoading && pending.length === 0 && !recentDecision && (
            <p className="text-sm text-stone-500 mt-2 inline-flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-stone-400" />
              Submit a draft from any document to start a review cycle.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

/* ----------------------------------------------------------------- */
/* Viewer                                                            */
/* ----------------------------------------------------------------- */

const ViewerPanel = () => (
  <section
    aria-label="Read-only access"
    className="rounded-xl border border-stone-200 bg-stone-50/50 p-5 mb-6"
  >
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl bg-stone-200 border border-stone-300 flex items-center justify-center flex-shrink-0">
        <Eye className="h-5 w-5 text-stone-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-stone-500 font-semibold">
          Stakeholder · read-only
        </p>
        <h2 className="text-base font-semibold text-stone-900 mt-1">
          You have read-only access to your workspaces
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          You can browse documents, tasks, and activity. You can't edit, comment,
          submit, or invite others. Reach out to a workspace owner if you need write
          access.
        </p>
      </div>
    </div>
  </section>
);
