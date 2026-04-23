import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuditLog, type AuditEvent } from "@/api/adapters/admin";
import { fullDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AdminPageHeader,
  AdminTableShell,
  AdminTH,
  AdminTR,
  AdminTD,
  SeverityChip,
} from "./admin-primitives";

const AUDIT_EVENT_TYPES = [
  { value: "auth.login", label: "Login" },
  { value: "auth.login_failed", label: "Login failed" },
  { value: "auth.logout", label: "Logout" },
  { value: "auth.register", label: "Registration" },
  { value: "auth.password_changed", label: "Password changed" },
  { value: "auth.password_reset", label: "Password reset" },
  { value: "user.deactivated", label: "User deactivated" },
  { value: "user.reactivated", label: "User reactivated" },
  { value: "user.role_changed", label: "Role changed" },
  { value: "workspace.deleted", label: "Workspace deleted" },
  { value: "workspace.archived", label: "Workspace archived" },
  { value: "member.removed", label: "Member removed" },
  { value: "document.exported", label: "Document exported" },
  { value: "ownership.transferred", label: "Ownership transferred" },
];

const DATE_RANGES = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "all", label: "ALL" },
];

const PAGE_SIZE = 50;

export const AdminAudit = () => {
  const [eventType, setEventType] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("7d");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drillIn, setDrillIn] = useState<AuditEvent | null>(null);

  useEffect(() => {
    document.title = "Audit Log — Admin — CollabSphere";
  }, []);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "audit", eventType, severity, dateRange, search, page],
    queryFn: () =>
      fetchAuditLog({
        eventType: eventType ?? undefined,
        severity: severity ?? undefined,
        dateRange,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const items = data?.data.items ?? [];
  const pagination = data?.meta.pagination;

  const lastUpdated = data
    ? new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : undefined;

  return (
    <div>
      <AdminPageHeader
        eyebrow="OPERATIONS · AUDIT"
        title="Audit log"
        description="Every security and administrative event. Click any row to drill into raw metadata."
        lastUpdated={lastUpdated}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Filter bar — outside the table for visual breathing room */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by actor…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-7 pl-8 pr-2.5 rounded-md text-[12px] bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 focus:outline-none"
            aria-label="Search audit events by actor"
          />
        </div>

        <select
          value={eventType ?? ""}
          onChange={(e) => {
            setEventType(e.target.value || null);
            setPage(1);
          }}
          className="h-7 rounded-md border border-stone-200 bg-white px-2 text-[11px] text-stone-700 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 focus:outline-none"
          aria-label="Filter by event type"
        >
          <option value="">All event types</option>
          {AUDIT_EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="flex" role="group" aria-label="Severity">
          {(["info", "warn", "error"] as const).map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSeverity(severity === s ? null : s);
                setPage(1);
              }}
              aria-pressed={severity === s}
              className={cn(
                "h-7 px-2 text-[11px] font-medium font-mono uppercase tracking-wider border border-stone-200 transition-colors",
                i === 0 && "rounded-l-md",
                i === 2 && "rounded-r-md",
                i > 0 && "border-l-0",
                severity === s
                  ? s === "error"
                    ? "bg-red-600 text-white border-red-600"
                    : s === "warn"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-stone-700 text-white border-stone-700"
                  : "bg-white text-stone-600 hover:bg-stone-50",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex" role="group" aria-label="Date range">
          {DATE_RANGES.map((range, i) => (
            <button
              key={range.value}
              type="button"
              onClick={() => {
                setDateRange(range.value);
                setPage(1);
              }}
              aria-pressed={dateRange === range.value}
              className={cn(
                "h-7 px-2 text-[11px] font-medium font-mono border border-stone-200 transition-colors",
                i === 0 && "rounded-l-md",
                i === DATE_RANGES.length - 1 && "rounded-r-md",
                i > 0 && "border-l-0",
                dateRange === range.value
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-stone-600 hover:bg-stone-50",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {(eventType || severity || search) && (
          <button
            type="button"
            onClick={() => {
              setEventType(null);
              setSeverity(null);
              setSearch("");
              setPage(1);
            }}
            className="h-7 px-2 rounded-md text-[11px] font-medium text-stone-500 hover:text-red-700 hover:bg-stone-50 transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-1.5" aria-busy="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center"
        >
          <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
          <p className="text-[13px] font-semibold text-stone-900 mt-2">
            Couldn't load audit log
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 h-8 px-3 rounded-md border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <AdminTableShell
            caption="Audit events"
            minWidth={1000}
            summary={
              <>
                <span className="font-mono text-[10px] tracking-wider tabular-nums">
                  {items.length} EVENTS
                </span>
                {pagination && (
                  <span className="font-mono text-[10px] text-stone-400 tracking-wider tabular-nums">
                    · {pagination.totalItems.toLocaleString()} TOTAL · CLICK ROW TO INSPECT
                  </span>
                )}
              </>
            }
            head={
              <tr>
                <AdminTH className="w-[150px]">Timestamp</AdminTH>
                <AdminTH>Event</AdminTH>
                <AdminTH className="w-[80px]">Severity</AdminTH>
                <AdminTH>Actor</AdminTH>
                <AdminTH className="w-[120px]">IP</AdminTH>
                <AdminTH>Details</AdminTH>
              </tr>
            }
          >
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium text-stone-900">
                    No audit events match your filters
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Try expanding the date range or clearing filters.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((event) => (
                <AdminTR
                  key={event.id}
                  onClick={() => setDrillIn(event)}
                  selected={drillIn?.id === event.id}
                >
                  <AdminTD mono>
                    <time
                      dateTime={event.createdAt}
                      title={fullDateTime(event.createdAt)}
                    >
                      {new Date(event.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </time>
                  </AdminTD>
                  <AdminTD mono className="text-stone-900">
                    {event.eventType}
                  </AdminTD>
                  <AdminTD>
                    <SeverityChip
                      tone={event.severity as "info" | "warn" | "error"}
                      dot
                    >
                      {event.severity}
                    </SeverityChip>
                  </AdminTD>
                  <AdminTD>
                    {event.actorName ? (
                      <div className="min-w-0">
                        <p className="text-[12px] text-stone-900 truncate">
                          {event.actorName}
                        </p>
                        <p className="font-mono text-[10px] text-stone-400 truncate">
                          {event.actorEmail}
                        </p>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-stone-400 italic">
                        SYSTEM
                      </span>
                    )}
                  </AdminTD>
                  <AdminTD mono className="text-stone-500">
                    {event.ipAddress}
                  </AdminTD>
                  <AdminTD>
                    <p className="text-[12px] text-stone-600 line-clamp-1">
                      {event.details}
                    </p>
                  </AdminTD>
                </AdminTR>
              ))
            )}
          </AdminTableShell>

          {pagination && pagination.totalPages > 1 && (
            <nav
              aria-label="Audit log pagination"
              className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3"
            >
              <span className="font-mono text-[10px] text-stone-400 tracking-wider tabular-nums">
                PAGE {pagination.page} / {pagination.totalPages} ·{" "}
                {pagination.totalItems.toLocaleString()} EVENTS
              </span>
              <div className="flex items-center gap-1.5">
                <PageButton
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Prev
                </PageButton>
                <PageButton
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page >= pagination.totalPages || isFetching}
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </PageButton>
              </div>
            </nav>
          )}
        </>
      )}

      <DrillInPanel event={drillIn} onClose={() => setDrillIn(null)} />
    </div>
  );
};

/* Drill-in slide-over — the real audit inspection surface. */

const DrillInPanel = ({
  event,
  onClose,
}: {
  event: AuditEvent | null;
  onClose: () => void;
}) => {
  if (!event) return null;

  const meta = event.metadata ?? {};
  const targetUserId =
    typeof meta.targetUserId === "string" ? meta.targetUserId : null;
  const workspaceId =
    typeof meta.workspaceId === "string" ? meta.workspaceId : null;

  const copyId = () => {
    navigator.clipboard.writeText(event.id);
    toast.success("Event ID copied");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-950/30 backdrop-blur-[2px] animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label={`Audit event ${event.id}`}
        className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-[460px] bg-white border-l border-stone-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/60">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-[3px] bg-red-600 rounded-sm" />
                <span className="font-mono text-[10px] text-red-700 tracking-[0.18em] uppercase">
                  AUDIT · DRILL-IN
                </span>
              </div>
              <h2 className="font-mono text-[14px] font-semibold text-stone-900 mt-2 break-all">
                {event.eventType}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <SeverityChip
                  tone={event.severity as "info" | "warn" | "error"}
                  dot
                >
                  {event.severity}
                </SeverityChip>
                <button
                  type="button"
                  onClick={copyId}
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-500 hover:text-red-700 transition-colors"
                  title="Copy event ID"
                >
                  <Copy className="h-3 w-3" />
                  {event.id}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 rounded flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Field label="Details">
            <p className="text-[13px] text-stone-700 leading-relaxed">
              {event.details}
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Timestamp">
              <p className="font-mono text-[11px] text-stone-700">
                {fullDateTime(event.createdAt)}
              </p>
            </Field>
            <Field label="IP address">
              <p className="font-mono text-[11px] text-stone-700">
                {event.ipAddress}
              </p>
            </Field>
          </div>

          <Field label="Actor">
            {event.actorName ? (
              <div className="rounded-md border border-stone-200 bg-stone-50/50 px-3 py-2">
                <p className="text-[13px] text-stone-900 font-medium">
                  {event.actorName}
                </p>
                <p className="font-mono text-[11px] text-stone-500 mt-0.5">
                  {event.actorEmail}
                </p>
                {event.actorId && (
                  <Link
                    to={`/admin/users/${event.actorId}`}
                    className="inline-flex items-center gap-1 mt-2 font-mono text-[10px] tracking-wider uppercase text-red-700 hover:text-red-800 transition-colors"
                  >
                    Open user
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ) : (
              <p className="font-mono text-[11px] text-stone-400 italic">
                SYSTEM
              </p>
            )}
          </Field>

          {(targetUserId || workspaceId) && (
            <Field label="Related">
              <div className="space-y-2">
                {targetUserId && (
                  <Link
                    to={`/admin/users/${targetUserId}`}
                    className="flex items-center justify-between rounded-md border border-stone-200 bg-white px-3 py-2 hover:border-red-200 hover:bg-red-50/30 transition-colors group"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase block">
                        Target user
                      </span>
                      <span className="font-mono text-[11px] text-stone-700">
                        {targetUserId}
                      </span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400 group-hover:text-red-700" />
                  </Link>
                )}
                {workspaceId && (
                  <Link
                    to={`/admin/workspaces/${workspaceId}`}
                    className="flex items-center justify-between rounded-md border border-stone-200 bg-white px-3 py-2 hover:border-red-200 hover:bg-red-50/30 transition-colors group"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase block">
                        Workspace
                      </span>
                      <span className="font-mono text-[11px] text-stone-700">
                        {workspaceId}
                      </span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400 group-hover:text-red-700" />
                  </Link>
                )}
              </div>
            </Field>
          )}

          <Field label="Raw metadata">
            <pre className="font-mono text-[11px] text-stone-700 bg-stone-950/95 text-stone-200 border border-stone-800 rounded-md p-3 overflow-x-auto leading-relaxed">
{JSON.stringify(event.metadata, null, 2)}
            </pre>
          </Field>
        </div>
      </aside>
    </>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <span className="font-mono text-[10px] text-stone-400 tracking-[0.14em] uppercase block mb-1.5">
      {label}
    </span>
    {children}
  </div>
);

const PageButton = ({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="h-7 px-2.5 rounded-md border border-stone-200 bg-white text-[11px] font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
  >
    {children}
  </button>
);
