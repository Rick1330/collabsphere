import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Archive,
  ArchiveRestore,
  ExternalLink,
  FileText,
  KanbanSquare,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/features/workspace/components/settings/confirm-dialog";
import {
  fetchAdminWorkspaces,
  adminArchiveWorkspace,
  adminUnarchiveWorkspace,
  adminForceDeleteWorkspace,
  type AdminWorkspace,
} from "@/api/adapters/admin";
import { fetchMembers, type WorkspaceMember } from "@/api/adapters/members";
import { fullDateTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminWorkspaceDetailProps {
  workspaceId: string;
}

export const AdminWorkspaceDetail = ({ workspaceId }: AdminWorkspaceDetailProps) => {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.title = `Workspace ${workspaceId} — Admin — CollabSphere`;
  }, [workspaceId]);

  const { data: wsResp, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "workspace", workspaceId, refreshKey],
    queryFn: async () => {
      // Reuse list endpoint and find the specific workspace
      const res = await fetchAdminWorkspaces({ page: 1, pageSize: 1000 });
      return res.data.items.find((w) => w.id === workspaceId) ?? null;
    },
  });

  const { data: memberResp, isLoading: membersLoading } = useQuery({
    queryKey: ["admin", "workspace", workspaceId, "members"],
    queryFn: () => fetchMembers(workspaceId),
  });

  const workspace: AdminWorkspace | null = wsResp ?? null;
  const members: WorkspaceMember[] = useMemo(
    () => memberResp?.data.items ?? [],
    [memberResp],
  );

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleArchive = async () => {
    if (!workspace) return;
    await adminArchiveWorkspace(workspace.id);
    refresh();
    toast.success(`${workspace.name} archived`);
  };

  const handleUnarchive = async () => {
    if (!workspace) return;
    await adminUnarchiveWorkspace(workspace.id);
    refresh();
    toast.success(`${workspace.name} unarchived`);
  };

  const handleForceDelete = async () => {
    if (!workspace) return;
    await adminForceDeleteWorkspace(workspace.id);
    toast.success(`${workspace.name} permanently deleted`);
    navigate("/admin/workspaces");
  };

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !workspace) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center"
      >
        <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-stone-900 mt-3">
          Workspace not found
        </p>
        <p className="text-xs text-stone-500 mt-1">
          It may have been deleted or you may not have access.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Link
            to="/admin/workspaces"
            className="h-8 px-3 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to list
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-8 px-3 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb back */}
      <Link
        to="/admin/workspaces"
        className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-stone-500 hover:text-red-700 transition-colors mb-4"
      >
        <ArrowLeft className="h-3 w-3" />
        All workspaces
      </Link>

      {/* Header */}
      <header className="border-b border-stone-200 pb-5 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-3 w-[3px] bg-red-600 rounded-sm" aria-hidden="true" />
              <span className="font-mono text-[10px] text-red-700 tracking-[0.22em] uppercase">
                WORKSPACE · DETAIL
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <h1 className="text-[22px] font-bold text-stone-900 tracking-tight">
                {workspace.name}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] uppercase font-medium px-1.5 h-[18px] rounded-sm border",
                  workspace.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    workspace.status === "active" ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
                {workspace.status}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] tracking-[0.1em] uppercase font-medium px-1.5 h-[18px] inline-flex items-center rounded-sm border",
                  workspace.type === "professional" &&
                    "bg-teal-50 text-teal-700 border-teal-200",
                  workspace.type === "academic" &&
                    "bg-amber-50 text-amber-700 border-amber-200",
                  workspace.type === "general" &&
                    "bg-stone-50 text-stone-500 border-stone-200",
                )}
              >
                {workspace.type}
              </span>
            </div>
            <p className="text-[13px] text-stone-500 mt-1.5">
              Owned by {workspace.ownerName} · Created{" "}
              <time dateTime={workspace.createdAt} title={fullDateTime(workspace.createdAt)}>
                {relativeTime(workspace.createdAt)}
              </time>
              <span className="font-mono text-[10px] text-stone-400 ml-2">id:{workspace.id}</span>
            </p>
          </div>
          <a
            href={`/w/${workspace.id}`}
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 rounded-md border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
            Open workspace
          </a>
        </div>
      </header>

      <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Members"
          value={workspace.memberCount}
          color="text-teal-600 bg-teal-50 border-teal-200"
        />
        <StatCard
          icon={FileText}
          label="Documents"
          value={workspace.documentCount}
          color="text-sky-600 bg-sky-50 border-sky-200"
        />
        <StatCard
          icon={KanbanSquare}
          label="Tasks"
          value={workspace.taskCount}
          color="text-amber-600 bg-amber-50 border-amber-200"
        />
      </div>

      {/* Members section */}
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Members</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              All people with access to this workspace.
            </p>
          </div>
          <span className="font-mono text-[10px] text-stone-400 tracking-wider tabular-nums">
            {members.length} TOTAL
          </span>
        </div>
        {membersLoading ? (
          <div className="p-5 space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-500">
            No members in this workspace.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {members.map((m) => (
              <li
                key={m.membershipId}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="h-8 w-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-semibold text-stone-600 shrink-0">
                  {m.user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-900 truncate">
                    {m.user.fullName}
                  </p>
                  <p className="text-xs text-stone-400 truncate">
                    {m.user.email}
                  </p>
                </div>
                <span className="font-mono text-[10px] tracking-wider uppercase text-stone-500 border border-stone-200 px-1.5 py-0.5 rounded">
                  {m.roleLabel}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-200 bg-red-50/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-red-200">
          <h2 className="text-sm font-semibold text-red-900">Admin actions</h2>
          <p className="text-xs text-red-700/70 mt-0.5">
            Platform-level controls. These bypass workspace permissions.
          </p>
        </div>
        <div className="p-5 space-y-3">
          {workspace.status === "active" ? (
            <button
              type="button"
              onClick={handleArchive}
              className="w-full sm:w-auto h-9 px-4 rounded-lg border border-amber-300 bg-white text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Archive workspace
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUnarchive}
              className="w-full sm:w-auto h-9 px-4 rounded-lg border border-amber-300 bg-white text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
            >
              <ArchiveRestore className="h-4 w-4" />
              Unarchive workspace
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full sm:w-auto h-9 px-4 rounded-lg border border-red-300 bg-white text-sm font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Force delete
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleForceDelete}
        title={`Force delete "${workspace.name}"?`}
        description="This permanently removes the workspace and all of its documents, tasks, and member data. This cannot be undone."
        confirmText={workspace.name}
        confirmLabel="Force delete"
        variant="destructive"
      />
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) => (
  <div className="rounded-xl border border-stone-200 bg-white shadow-sm p-4 flex items-center gap-3">
    <div className={cn("h-9 w-9 rounded-lg border flex items-center justify-center shrink-0", color)}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="font-mono text-[10px] text-stone-400 tracking-wider uppercase">
        {label}
      </p>
      <p className="text-xl font-bold text-stone-900 tabular-nums leading-tight">
        {value.toLocaleString()}
      </p>
    </div>
  </div>
);
