import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/features/workspace/components/settings/confirm-dialog";
import {
  fetchAdminWorkspaces,
  adminArchiveWorkspace,
  adminUnarchiveWorkspace,
  adminForceDeleteWorkspace,
  type AdminWorkspace,
} from "@/api/adapters/admin";
import { fullDateTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminTableShell,
  AdminTH,
  AdminTR,
  AdminTD,
  SeverityChip,
} from "./admin-primitives";

const PAGE_SIZE = 25;
type StatusFilter = "all" | "active" | "archived";
type TypeFilter = "all" | "professional" | "academic" | "general";

export const AdminWorkspaces = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminWorkspace | null>(null);

  useEffect(() => {
    document.title = "Workspaces — Admin — CollabSphere";
  }, []);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "workspaces", search, page],
    queryFn: () =>
      fetchAdminWorkspaces({ search, page, pageSize: PAGE_SIZE }),
  });

  const items = data?.data.items ?? [];
  const pagination = data?.meta.pagination;

  const filtered = useMemo(
    () =>
      items.filter((w) => {
        if (statusFilter !== "all" && w.status !== statusFilter) return false;
        if (typeFilter !== "all" && w.type !== typeFilter) return false;
        return true;
      }),
    [items, statusFilter, typeFilter],
  );

  const handleArchive = async (ws: AdminWorkspace) => {
    try {
      await adminArchiveWorkspace(ws.id);
      await refetch();
      toast.success(`${ws.name} archived`);
    } catch {
      toast.error("Failed to archive workspace.");
    }
  };

  const handleUnarchive = async (ws: AdminWorkspace) => {
    try {
      await adminUnarchiveWorkspace(ws.id);
      await refetch();
      toast.success(`${ws.name} unarchived`);
    } catch {
      toast.error("Failed to unarchive workspace.");
    }
  };

  const handleForceDelete = async () => {
    if (!deleteTarget) return;
    await adminForceDeleteWorkspace(deleteTarget.id);
    await refetch();
    toast.success(`${deleteTarget.name} permanently deleted`);
  };

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
        eyebrow="OPERATIONS · WORKSPACES"
        title="Workspaces"
        description="Inspect, archive, or force-delete any workspace on the platform."
        lastUpdated={lastUpdated}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {isLoading && (
        <div className="space-y-1.5" aria-busy="true">
          <Skeleton className="h-9 w-full rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
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
            Couldn't load workspaces
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
            caption="Platform workspaces"
            minWidth={960}
            toolbar={
              <>
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  <input
                    type="search"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-7 pl-8 pr-2.5 rounded-md text-[12px] bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 focus:outline-none"
                    aria-label="Search workspaces"
                  />
                </div>
                <FacetGroup
                  label="Status"
                  options={[
                    { v: "all", l: "All" },
                    { v: "active", l: "Active" },
                    { v: "archived", l: "Archived" },
                  ]}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as StatusFilter)}
                />
                <FacetGroup
                  label="Type"
                  options={[
                    { v: "all", l: "All" },
                    { v: "professional", l: "Pro" },
                    { v: "academic", l: "Acad" },
                    { v: "general", l: "Gen" },
                  ]}
                  value={typeFilter}
                  onChange={(v) => setTypeFilter(v as TypeFilter)}
                />
              </>
            }
            summary={
              <>
                <span className="font-mono text-[10px] tracking-wider tabular-nums">
                  {filtered.length} SHOWN
                </span>
                {pagination && (
                  <span className="font-mono text-[10px] text-stone-400 tracking-wider tabular-nums">
                    · {pagination.totalItems.toLocaleString()} TOTAL
                  </span>
                )}
              </>
            }
            head={
              <tr>
                <AdminTH>Workspace</AdminTH>
                <AdminTH>Type</AdminTH>
                <AdminTH>Owner</AdminTH>
                <AdminTH align="right">Members</AdminTH>
                <AdminTH align="right">Docs</AdminTH>
                <AdminTH>Status</AdminTH>
                <AdminTH>Created</AdminTH>
                <AdminTH align="right">Actions</AdminTH>
              </tr>
            }
          >
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium text-stone-900">
                    No workspaces match these filters
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Clear search or facet filters to see more.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((ws) => (
                <AdminTR key={ws.id}>
                  <AdminTD>
                    <Link
                      to={`/admin/workspaces/${ws.id}`}
                      className="block min-w-0 group"
                    >
                      <p className="text-[12px] font-medium text-stone-900 truncate group-hover:text-red-700 transition-colors">
                        {ws.name}
                      </p>
                      <p className="font-mono text-[10px] text-stone-400 truncate tabular-nums">
                        {ws.taskCount} tasks · id:{ws.id}
                      </p>
                    </Link>
                  </AdminTD>
                  <AdminTD>
                    <SeverityChip
                      tone={
                        ws.type === "professional"
                          ? "professional"
                          : ws.type === "academic"
                          ? "academic"
                          : "neutral"
                      }
                    >
                      {ws.type}
                    </SeverityChip>
                  </AdminTD>
                  <AdminTD>
                    <p className="text-[12px] text-stone-800 truncate">
                      {ws.ownerName}
                    </p>
                    <p className="font-mono text-[10px] text-stone-400 truncate">
                      {ws.ownerEmail}
                    </p>
                  </AdminTD>
                  <AdminTD align="right" mono>
                    {ws.memberCount}
                  </AdminTD>
                  <AdminTD align="right" mono>
                    {ws.documentCount}
                  </AdminTD>
                  <AdminTD>
                    <SeverityChip
                      tone={ws.status === "active" ? "success" : "warn"}
                      dot
                    >
                      {ws.status}
                    </SeverityChip>
                  </AdminTD>
                  <AdminTD mono>
                    <time
                      dateTime={ws.createdAt}
                      title={fullDateTime(ws.createdAt)}
                    >
                      {relativeTime(ws.createdAt)}
                    </time>
                  </AdminTD>
                  <AdminTD align="right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-6 w-6 rounded flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors ml-auto"
                          aria-label={`Actions for ${ws.name}`}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/admin/workspaces/${ws.id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-stone-500" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={`/w/${ws.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
                            Open workspace
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {ws.status === "active" ? (
                          <DropdownMenuItem
                            onClick={() => handleArchive(ws)}
                            className="flex items-center gap-2"
                          >
                            <Archive className="h-3.5 w-3.5 text-stone-500" />
                            Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleUnarchive(ws)}
                            className="flex items-center gap-2"
                          >
                            <ArchiveRestore className="h-3.5 w-3.5 text-stone-500" />
                            Unarchive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(ws)}
                          className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Force delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </AdminTD>
                </AdminTR>
              ))
            )}
          </AdminTableShell>

          {pagination && pagination.totalPages > 1 && (
            <nav
              aria-label="Workspace list pagination"
              className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3"
            >
              <span className="font-mono text-[10px] text-stone-400 tracking-wider tabular-nums">
                PAGE {pagination.page} / {pagination.totalPages} ·{" "}
                {pagination.totalItems.toLocaleString()} WORKSPACES
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleForceDelete}
        title={`Force delete "${deleteTarget?.name ?? ""}"?`}
        description="This permanently removes the workspace and all of its documents, tasks, and member data. This cannot be undone."
        confirmText={deleteTarget?.name ?? ""}
        confirmLabel="Force delete"
        variant="destructive"
      />
    </div>
  );
};

const FacetGroup = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ v: string; l: string }>;
  value: string;
  onChange: (v: string) => void;
}) => (
  <fieldset className="flex items-center gap-1.5 min-w-0">
    <legend className="sr-only">{label}</legend>
    <span className="font-mono text-[9px] text-stone-400 tracking-[0.14em] uppercase">
      {label}
    </span>
    <div className="flex">
      {options.map((opt, i) => (
        <button
          key={opt.v}
          type="button"
          onClick={() => onChange(opt.v)}
          aria-pressed={value === opt.v}
          className={cn(
            "h-7 px-2 text-[11px] font-medium border border-stone-200 transition-colors",
            i === 0 && "rounded-l-md",
            i === options.length - 1 && "rounded-r-md",
            i > 0 && "border-l-0",
            value === opt.v
              ? "bg-red-600 text-white border-red-600"
              : "bg-white text-stone-600 hover:bg-stone-50",
          )}
        >
          {opt.l}
        </button>
      ))}
    </div>
  </fieldset>
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
