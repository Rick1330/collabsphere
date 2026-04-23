import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  HardDrive,
  ShieldAlert,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminSection,
  Kpi,
  SeverityChip,
} from "./admin-primitives";
import {
  fetchAdminOperationalStats,
  fetchRecentCriticalEvents,
  fetchTopWorkspaces,
  formatBytes,
} from "@/api/adapters/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { fullDateTime, relativeTime } from "@/lib/format";

export const AdminDashboard = () => {
  const stats = useQuery({
    queryKey: ["admin", "ops-stats"],
    queryFn: fetchAdminOperationalStats,
    select: (r) => r.data,
  });
  const critical = useQuery({
    queryKey: ["admin", "critical-events"],
    queryFn: () => fetchRecentCriticalEvents(8),
    select: (r) => r.data.items,
  });
  const top = useQuery({
    queryKey: ["admin", "top-workspaces"],
    queryFn: () => fetchTopWorkspaces(5),
    select: (r) => r.data.items,
  });

  useEffect(() => {
    document.title = "Admin Dashboard — CollabSphere";
  }, []);

  const refreshAll = () => {
    stats.refetch();
    critical.refetch();
    top.refetch();
  };

  const lastUpdated = stats.dataUpdatedAt
    ? new Date(stats.dataUpdatedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  const data = stats.data;
  const storagePct = data
    ? Math.min(100, (data.storageUsedBytes / data.storageQuotaBytes) * 100)
    : 0;

  return (
    <div>
      <AdminPageHeader
        eyebrow="OPERATIONS · OVERVIEW"
        title="Platform health"
        description="Real-time signal across users, workspaces, content, and security events."
        lastUpdated={lastUpdated}
        onRefresh={refreshAll}
        isRefreshing={stats.isFetching || critical.isFetching || top.isFetching}
      />

      {stats.isError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50/50 p-4 flex items-start gap-3"
        >
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1 text-[13px] text-red-800">
            Stats endpoint failed.{" "}
            <button
              type="button"
              onClick={() => stats.refetch()}
              className="underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-lg" />
          ))
        ) : (
          <>
            <Kpi
              label="ACTIVE 7D"
              value={data.activeUsersLast7Days.toLocaleString()}
              hint={`of ${data.totalUsers}`}
              delta={`+${data.newUsersLast7Days} new`}
              deltaTone={data.newUsersLast7Days > 0 ? "up" : "neutral"}
              spark={data.activeUsersTrend}
            />
            <Kpi
              label="WORKSPACES"
              value={data.totalWorkspaces.toLocaleString()}
              hint={`${data.archivedWorkspaces} archived`}
              delta={
                data.newWorkspacesLast7Days > 0
                  ? `+${data.newWorkspacesLast7Days} this week`
                  : "0 this week"
              }
              deltaTone={data.newWorkspacesLast7Days > 0 ? "up" : "neutral"}
            />
            <Kpi
              label="EVENTS (24H)"
              value={(data.errorEventsLast24h + data.warnEventsLast24h).toLocaleString()}
              hint={`${data.errorEventsLast24h} err · ${data.warnEventsLast24h} warn`}
              delta={data.errorEventsLast24h > 0 ? "investigate" : "all clear"}
              deltaTone={data.errorEventsLast24h > 0 ? "down" : "up"}
              spark={data.eventsTrend}
            />
            <Kpi
              label="ADMINS"
              value={data.adminCount.toLocaleString()}
              hint={`${data.deactivatedUsers} deactivated`}
              delta="role count"
              deltaTone="neutral"
            />
          </>
        )}
      </div>

      {/* Two-column ops layout: critical events feed (primary) + system column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Critical events feed — primary column */}
        <div className="lg:col-span-2 space-y-4">
          <AdminSection
            title="Recent critical events"
            description="Errors and warnings from the audit log, last 24h prioritized."
            action={
              <Link
                to="/admin/audit"
                className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase text-stone-500 hover:text-red-700 transition-colors"
              >
                Audit log
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            {critical.isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (critical.data ?? []).length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                <p className="text-[13px] text-stone-700 mt-2 font-medium">
                  No critical events
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Platform looks healthy.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {(critical.data ?? []).map((e) => (
                  <li
                    key={e.id}
                    className="px-3 py-2.5 hover:bg-red-50/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <SeverityChip tone={e.severity as "warn" | "error"} dot>
                        {e.severity}
                      </SeverityChip>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-stone-900">
                            {e.eventType}
                          </span>
                          <time
                            dateTime={e.createdAt}
                            title={fullDateTime(e.createdAt)}
                            className="font-mono text-[10px] text-stone-400 tracking-wider"
                          >
                            {relativeTime(e.createdAt)}
                          </time>
                        </div>
                        <p className="text-[12px] text-stone-600 mt-0.5 line-clamp-1">
                          {e.details}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-stone-400 tabular-nums hidden sm:inline-block shrink-0">
                        {e.ipAddress}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>

          <AdminSection
            title="Top workspaces by members"
            description="Active workspaces with the largest member count."
            action={
              <Link
                to="/admin/workspaces"
                className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase text-stone-500 hover:text-red-700 transition-colors"
              >
                All workspaces
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            {top.isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {(top.data ?? []).map((w, i) => (
                  <li key={w.id}>
                    <Link
                      to={`/admin/workspaces/${w.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50/30 transition-colors group"
                    >
                      <span className="font-mono text-[10px] text-stone-400 tabular-nums w-5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <SeverityChip tone={w.type as "professional" | "academic" | "neutral"}>
                        {w.type}
                      </SeverityChip>
                      <span className="text-[13px] font-medium text-stone-900 group-hover:text-red-700 truncate flex-1">
                        {w.name}
                      </span>
                      <span className="font-mono text-[11px] text-stone-500 tabular-nums">
                        {w.memberCount} members
                      </span>
                      <span className="font-mono text-[10px] text-stone-400 tabular-nums hidden sm:inline-block">
                        {w.documentCount} docs
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>
        </div>

        {/* System column */}
        <div className="space-y-4">
          <AdminSection title="System status" dense>
            <ul className="divide-y divide-stone-100 text-[12px]">
              <SystemRow label="API" value="v1.4.2" tone="success" />
              <SystemRow label="Database" value="healthy" tone="success" dot />
              <SystemRow label="Storage" value="healthy" tone="success" dot />
              <SystemRow label="Region" value="us-east-1" tone="info" />
              <SystemRow label="Environment" value="production" tone="info" />
            </ul>
          </AdminSection>

          <AdminSection title="Storage" dense>
            <div className="p-3">
              {stats.isLoading || !data ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3.5 w-3.5 text-stone-400" />
                      <span className="font-mono text-[10px] text-stone-500 tracking-wider uppercase">
                        Used
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-stone-700 tabular-nums">
                      {formatBytes(data.storageUsedBytes)} / {formatBytes(data.storageQuotaBytes)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-red-600/80 rounded-full transition-all"
                      style={{ width: `${storagePct}%` }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-stone-400 tracking-wider mt-2 tabular-nums">
                    {storagePct.toFixed(1)}% USED
                  </p>
                </>
              )}
            </div>
          </AdminSection>

          <AdminSection title="Posture" dense>
            <ul className="divide-y divide-stone-100">
              <PostureRow
                icon={ShieldAlert}
                label="Failed logins (24h)"
                value={data?.warnEventsLast24h ?? 0}
                tone="warn"
              />
              <PostureRow
                icon={AlertTriangle}
                label="Critical events (24h)"
                value={data?.errorEventsLast24h ?? 0}
                tone={data && data.errorEventsLast24h > 0 ? "error" : "info"}
              />
              <PostureRow
                icon={CheckCircle2}
                label="Verified admins"
                value={data?.adminCount ?? 0}
                tone="success"
              />
            </ul>
          </AdminSection>
        </div>
      </div>
    </div>
  );
};

const SystemRow = ({
  label,
  value,
  tone,
  dot,
}: {
  label: string;
  value: string;
  tone: "success" | "info" | "warn" | "error";
  dot?: boolean;
}) => (
  <li className="flex items-center justify-between px-3 py-2">
    <span className="font-mono text-[10px] text-stone-500 tracking-wider uppercase">
      {label}
    </span>
    <SeverityChip tone={tone} dot={dot}>
      {value}
    </SeverityChip>
  </li>
);

const PostureRow = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "info" | "warn" | "error" | "success";
}) => {
  const color =
    tone === "error"
      ? "text-red-600"
      : tone === "warn"
      ? "text-amber-600"
      : tone === "success"
      ? "text-emerald-600"
      : "text-stone-400";
  return (
    <li className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-[12px] text-stone-700">{label}</span>
      </div>
      <span className="font-mono text-[14px] font-bold text-stone-900 tabular-nums">
        {value}
      </span>
    </li>
  );
};
