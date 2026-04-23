import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Activity as ActivityIcon,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Lock,
  Minus,
  Users,
} from "lucide-react";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { WorkspaceSidebar, type WorkspaceForSidebar } from "@/features/workspace/components/workspace-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useStoredWorkspaces } from "@/features/workspace/store/workspace-store";
import { PageHeader } from "@/components/shared/page-header";
import {
  fetchAnalyticsSnapshot,
  type KpiBlock,
  type AnalyticsSnapshot,
} from "@/api/adapters/analytics";
import { useQuery } from "@tanstack/react-query";
import { relativeTime, getInitials, getAvatarColor } from "@/lib/format";
import { cn } from "@/lib/utils";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };

const FALLBACK_WS: WorkspaceForSidebar = {
  id: "alpha",
  name: "Project Alpha",
  description: "Building the next-gen collaboration platform.",
  icon: "📦",
  type: "professional",
  roleLabel: "TECH LEAD",
  status: "active",
  permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
};

const DOC_STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:               { label: "Draft",             cls: "bg-stone-100 text-stone-700" },
  submitted:           { label: "Submitted",         cls: "bg-amber-100 text-amber-700" },
  changes_requested:   { label: "Changes",           cls: "bg-red-100 text-red-700" },
  approved:            { label: "Approved",          cls: "bg-emerald-100 text-emerald-700" },
  archived:            { label: "Archived",          cls: "bg-stone-200 text-stone-600" },
};

const Analytics = () => {
  const { workspaceId = "alpha" } = useParams<{ workspaceId: string }>();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
  const stored = useStoredWorkspaces();

  const workspace = useMemo<WorkspaceForSidebar>(() => {
    const fromStore = stored.find((w) => w.id === workspaceId);
    if (fromStore) {
      return {
        id: fromStore.id,
        name: fromStore.name,
        description: fromStore.description || "",
        icon: fromStore.icon || "✨",
        type: fromStore.type,
        roleLabel: fromStore.roleLabel,
        status: fromStore.status,
        permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
      };
    }
    return { ...FALLBACK_WS, id: workspaceId };
  }, [workspaceId, stored]);

  const isAcademic = workspace.type === "academic";

  const { data, isLoading: snapshotLoading } = useQuery({
    queryKey: ["analytics", workspaceId, workspace.type],
    queryFn: () => fetchAnalyticsSnapshot(workspaceId, workspace.type),
  });

  const loading = snapshotLoading || !data;
  useEffect(() => {
    document.title = `Analytics — ${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  const canView = workspace.permissions.canViewAnalytics;

  return (
    <div className="app-light min-h-screen flex">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto w-full">
          <PageHeader
            variant="contextual"
            eyebrow="Insights"
            title="Analytics"
            description="A calm read on workspace health — contributions, document progress, and task throughput."
            icon={<BarChart3 className="h-5 w-5 text-stone-700" />}
          />

          {!canView ? (
            <PermissionGate />
          ) : loading ? (
            <Skeleton />
          ) : (
            <>
              {/* KPI strip — max 4 */}
              <section className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {data.kpis.slice(0, 4).map((k) => (
                  <KpiTile key={k.key} kpi={k} />
                ))}
              </section>

              {/* Two major sections above the fold */}
              <section className="mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                <Card title="Task throughput" subtitle="Created vs completed, last 4 weeks">
                  <ThroughputChart data={data.throughput} />
                </Card>
                <Card title="Activity trend" subtitle="Workspace events, last 7 days">
                  <ActivitySpark data={data.trend} />
                </Card>
              </section>

              {/* Below fold — sections */}
              <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
                <Card
                  title="Document progress"
                  subtitle="Where docs are sitting today"
                  action={
                    <Link
                      to={`/w/${workspaceId}/documents`}
                      className="text-[12px] text-teal-700 hover:text-teal-800 font-medium inline-flex items-center gap-1"
                    >
                      View documents <ChevronRight className="h-3 w-3" />
                    </Link>
                  }
                >
                  <DocStatusBars data={data.documents} />
                </Card>

                <Card
                  title="Member contribution"
                  subtitle="Authoring, completion, and recency"
                  action={
                    <Link
                      to={`/w/${workspaceId}/members`}
                      className="text-[12px] text-teal-700 hover:text-teal-800 font-medium inline-flex items-center gap-1"
                    >
                      View members <ChevronRight className="h-3 w-3" />
                    </Link>
                  }
                >
                  <MemberTable members={data.members} />
                </Card>
              </section>

              {/* Academic signals — only for academic workspaces */}
              {data.academic.enabled && (
                <section className="mt-6">
                  <Card
                    title="Academic review signal"
                    subtitle="Supervisor workflow load"
                    icon={<GraduationCap className="h-4 w-4 text-amber-600" />}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Stat
                        label="Pending reviews"
                        value={data.academic.pendingReviews.toString()}
                        helper="awaiting supervisor"
                      />
                      <Stat
                        label="Avg. turnaround"
                        value={`${data.academic.avgReviewTurnaroundHours}h`}
                        helper="from submission to feedback"
                      />
                      <Stat
                        label="Overdue submissions"
                        value={data.academic.overdueSubmissions.toString()}
                        helper="past deadline"
                        tone={data.academic.overdueSubmissions > 0 ? "bad" : "good"}
                      />
                    </div>
                  </Card>
                </section>
              )}
            </>
          )}
        </main>
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default Analytics;

/* ─────────── KPI ─────────── */
const KpiTile = ({ kpi }: { kpi: KpiBlock }) => {
  const arrow = kpi.delta?.direction;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="font-mono text-[10px] text-stone-500 tracking-[0.18em] uppercase">
        {kpi.label}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span
          className="text-[28px] tracking-tight text-stone-900 leading-none tabular-nums"
          style={{ fontFamily: "Georgia, 'Iowan Old Style', serif", fontWeight: 600 }}
        >
          {kpi.value}
        </span>
        {kpi.delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums pb-1",
              kpi.delta.tone === "good" && "text-emerald-700",
              kpi.delta.tone === "bad" && "text-red-700",
              (kpi.delta.tone === "neutral" || !kpi.delta.tone) && "text-stone-500",
            )}
          >
            {arrow === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : arrow === "down" ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {kpi.delta.value}
          </span>
        )}
      </div>
      {kpi.helper && (
        <p className="text-[11px] text-stone-400 mt-1.5">{kpi.helper}</p>
      )}
    </div>
  );
};

/* ─────────── Card wrapper ─────────── */
const Card = ({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-stone-200 bg-white">
    <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        {icon}
        <div>
          <h3 className="text-[14px] font-semibold text-stone-900">{title}</h3>
          {subtitle && <p className="text-[11.5px] text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ─────────── Throughput chart (paired bars) ─────────── */
const ThroughputChart = ({
  data,
}: {
  data: { weekLabel: string; completed: number; created: number }[];
}) => {
  const max = Math.max(...data.flatMap((d) => [d.completed, d.created]), 1);
  return (
    <div>
      <div className="flex items-end gap-3 h-44">
        {data.map((d) => {
          const cH = (d.completed / max) * 100;
          const xH = (d.created / max) * 100;
          return (
            <div key={d.weekLabel} className="flex-1 flex flex-col items-center justify-end gap-1.5">
              <div className="w-full flex items-end gap-1 h-full">
                <div
                  title={`Created: ${d.created}`}
                  style={{ height: `${xH}%` }}
                  className="flex-1 rounded-sm bg-stone-200"
                />
                <div
                  title={`Completed: ${d.completed}`}
                  style={{ height: `${cH}%` }}
                  className="flex-1 rounded-sm bg-teal-600"
                />
              </div>
              <span className="font-mono text-[10px] text-stone-500 tracking-wider tabular-nums">
                {d.weekLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-100">
        <Legend swatch="bg-teal-600" label="Completed" />
        <Legend swatch="bg-stone-200" label="Created" />
      </div>
    </div>
  );
};

const Legend = ({ swatch, label }: { swatch: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-[11.5px] text-stone-600">
    <span className={cn("h-2.5 w-2.5 rounded-sm", swatch)} />
    {label}
  </span>
);

/* ─────────── Activity sparkline (area-ish bars) ─────────── */
const ActivitySpark = ({ data }: { data: { dayLabel: string; events: number }[] }) => {
  const max = Math.max(...data.map((d) => d.events), 1);
  const total = data.reduce((a, d) => a + d.events, 0);
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="text-[24px] tracking-tight text-stone-900 tabular-nums leading-none"
          style={{ fontFamily: "Georgia, 'Iowan Old Style', serif", fontWeight: 600 }}
        >
          {total}
        </span>
        <span className="text-[11.5px] text-stone-500">events this week</span>
      </div>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d) => (
          <div key={d.dayLabel} className="flex-1 flex flex-col items-center gap-1.5 justify-end">
            <div
              style={{ height: `${(d.events / max) * 100}%` }}
              className="w-full rounded-sm bg-gradient-to-t from-teal-500 to-teal-300 min-h-[2px]"
              title={`${d.dayLabel}: ${d.events} events`}
            />
            <span className="font-mono text-[10px] text-stone-400 tabular-nums">
              {d.dayLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────── Doc status bars ─────────── */
const DocStatusBars = ({
  data,
}: {
  data: { status: string; count: number }[];
}) => {
  const total = data.reduce((a, d) => a + d.count, 0) || 1;
  return (
    <ul className="space-y-2.5">
      {data.map((d) => {
        const meta = DOC_STATUS_META[d.status] ?? { label: d.status, cls: "bg-stone-100 text-stone-700" };
        const pct = (d.count / total) * 100;
        return (
          <li key={d.status}>
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span className="text-stone-700 font-medium">{meta.label}</span>
              <span className="font-mono text-stone-500 tabular-nums">
                {d.count}
                <span className="text-stone-400"> · {pct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={cn(
                  "h-full",
                  d.status === "approved" && "bg-emerald-500",
                  d.status === "submitted" && "bg-amber-500",
                  d.status === "changes_requested" && "bg-red-500",
                  d.status === "draft" && "bg-stone-400",
                  d.status === "archived" && "bg-stone-300",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/* ─────────── Member table ─────────── */
const MemberTable = ({ members }: { members: AnalyticsSnapshot["members"] }) => {
  const sorted = [...members].sort(
    (a, b) =>
      b.docsAuthored + b.tasksCompleted - (a.docsAuthored + a.tasksCompleted),
  );
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[420px]">
        <thead>
          <tr className="text-[10px] font-mono tracking-[0.18em] uppercase text-stone-500 border-b border-stone-100">
            <th className="text-left px-5 py-2 font-medium">Member</th>
            <th className="text-right px-3 py-2 font-medium">Docs</th>
            <th className="text-right px-3 py-2 font-medium">Tasks</th>
            <th className="text-right px-3 py-2 font-medium">Comments</th>
            <th className="text-right px-5 py-2 font-medium">Last active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {sorted.map((m) => (
            <tr key={m.id} className="hover:bg-stone-50/60 transition-colors">
              <td className="px-5 py-2.5">
                <span className="inline-flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-6 w-6 rounded-full text-[10px] font-semibold text-white inline-flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(m.fullName) }}
                  >
                    {getInitials(m.fullName)}
                  </span>
                  <span className="min-w-0">
                    <span className="text-[13px] font-medium text-stone-900 block truncate">
                      {m.fullName}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400 tracking-wider">
                      {m.role}
                    </span>
                  </span>
                </span>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-[12.5px] text-stone-700">
                {m.docsAuthored}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-[12.5px] text-stone-700">
                {m.tasksCompleted}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-[12.5px] text-stone-700">
                {m.commentsLeft}
              </td>
              <td className="px-5 py-2.5 text-right">
                <time className="font-mono text-[11px] text-stone-500 tabular-nums">
                  {relativeTime(m.lastActiveAt)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ─────────── Misc ─────────── */
const Stat = ({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "good" | "bad";
}) => (
  <div>
    <div className="font-mono text-[10px] text-stone-500 tracking-[0.18em] uppercase">
      {label}
    </div>
    <div
      className={cn(
        "text-[26px] tracking-tight tabular-nums mt-1.5 leading-none",
        tone === "good" && "text-emerald-700",
        tone === "bad" && "text-red-700",
        !tone && "text-stone-900",
      )}
      style={{ fontFamily: "Georgia, 'Iowan Old Style', serif", fontWeight: 600 }}
    >
      {value}
    </div>
    {helper && <p className="text-[11px] text-stone-500 mt-1">{helper}</p>}
  </div>
);

const Skeleton = () => (
  <>
    <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="h-2.5 w-1/2 rounded bg-stone-100 animate-pulse" />
          <div className="h-8 w-2/3 rounded bg-stone-100 animate-pulse mt-3" />
          <div className="h-2.5 w-1/3 rounded bg-stone-100 animate-pulse mt-3" />
        </div>
      ))}
    </div>
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="h-3 w-1/3 rounded bg-stone-100 animate-pulse" />
          <div className="h-44 w-full rounded bg-stone-50 animate-pulse mt-4" />
        </div>
      ))}
    </div>
  </>
);

const PermissionGate = () => (
  <div className="mt-10 rounded-xl border border-stone-200 bg-white p-12 text-center">
    <div className="h-12 w-12 rounded-xl bg-stone-50 border border-stone-200 mx-auto flex items-center justify-center mb-3">
      <Lock className="h-5 w-5 text-stone-400" />
    </div>
    <p className="text-base font-medium text-stone-900">Analytics is restricted</p>
    <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
      Only managers and supervisors can view workspace analytics. Ask your owner to upgrade your role.
    </p>
  </div>
);
