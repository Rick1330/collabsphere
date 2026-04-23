import { CheckSquare, FileText, Users, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionError } from "@/components/shared/section-error";
import { AVATAR_COLORS, getInitials, relativeTime, fullDateTime } from "@/lib/format";
import {
  getDashboardWorkspaces,
  type DashboardWorkspaceSummary,
} from "@/api/adapters/dashboard";

type State = "loading" | "loaded" | "empty" | "error";

export const DashboardWorkspaces = () => {
  const [state, setState] = useState<State>("loading");
  const [workspaces, setWorkspaces] = useState<DashboardWorkspaceSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getDashboardWorkspaces()
      .then((data) => {
        if (cancelled) return;
        setWorkspaces(data);
        setState(data.length === 0 ? "empty" : "loaded");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="workspaces-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="workspaces-heading" className="text-sm font-semibold text-stone-900 flex items-center gap-2">
          Your workspaces
          {state === "loaded" && (
            <span className="font-mono text-[10px] text-stone-400 font-normal">{workspaces.length}</span>
          )}
        </h2>
        <Link
          to="/dashboard"
          className="text-[13px] font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          View all →
        </Link>
      </div>

      {state === "loading" && <LoadingGrid />}
      {state === "empty" && <EmptyWorkspaces />}
      {state === "error" && (
        <SectionError sectionName="workspaces" requestId="req_4f8a2c9d" onRetry={() => setState("loaded")} />
      )}
      {state === "loaded" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workspaces.slice(0, 6).map((w) => (
            <WorkspaceCard key={w.id} workspace={w} />
          ))}
        </div>
      )}
    </section>
  );
};

const WorkspaceCard = ({ workspace }: { workspace: DashboardWorkspaceSummary }) => {
  return (
    <Link
      to={`/w/${workspace.id}`}
      className="group block rounded-xl border border-stone-200 bg-white p-5 shadow-card
        transition-all duration-200 hover:shadow-md hover:border-stone-300 hover:-translate-y-[2px]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
              "transition-transform duration-200 group-hover:scale-105 border",
              workspace.type === "professional" && "bg-teal-50 text-teal-700 border-teal-200",
              workspace.type === "academic" && "bg-amber-50 text-amber-700 border-amber-200",
              workspace.type === "general" && "bg-stone-100 text-stone-600 border-stone-200",
            )}
            aria-hidden="true"
          >
            {workspace.icon || getInitials(workspace.name, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-stone-900 truncate group-hover:text-teal-700 transition-colors duration-200">
              {workspace.name}
            </h3>
            <p className="text-xs text-stone-500 truncate mt-0.5">{workspace.description}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full flex-shrink-0 border",
            workspace.type === "professional" && "bg-teal-50 text-teal-600 border-teal-200",
            workspace.type === "academic" && "bg-amber-50 text-amber-600 border-amber-200",
            workspace.type === "general" && "bg-stone-100 text-stone-500 border-stone-200",
          )}
        >
          {workspace.type}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100">
        <Stat icon={FileText} value={workspace.docs} label="docs" />
        <Stat icon={CheckSquare} value={workspace.tasks} label="tasks" />
        <Stat icon={Users} value={workspace.memberCount} label="members" />
        <div className="flex-1" />
        <time
          dateTime={workspace.lastAccessedAt}
          title={fullDateTime(workspace.lastAccessedAt)}
          className="font-mono text-[10px] text-stone-400 tracking-wider"
        >
          {relativeTime(workspace.lastAccessedAt)}
        </time>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex -space-x-1.5">
          {workspace.recentMembers.slice(0, 4).map((m, i) => (
            <div
              key={m.id}
              className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
              style={{
                backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                color: "white",
                zIndex: 4 - i,
              }}
              title={m.fullName}
              aria-hidden="true"
            >
              {getInitials(m.fullName, 1)}
            </div>
          ))}
          {workspace.memberCount > 4 && (
            <div
              className="h-6 w-6 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[9px] font-medium text-stone-500"
              style={{ zIndex: 0 }}
              aria-hidden="true"
            >
              +{workspace.memberCount - 4}
            </div>
          )}
        </div>
        <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase">
          {workspace.roleLabel}
        </span>
      </div>
    </Link>
  );
};

const Stat = ({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) => (
  <div className="flex items-center gap-1.5">
    <Icon className="h-3.5 w-3.5 text-stone-400" />
    <span className="text-xs text-stone-500">
      <span className="font-medium text-stone-700">{value}</span> {label}
    </span>
  </div>
);

const LoadingGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-busy="true">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-4 mt-4 pt-3 border-t border-stone-100">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-14 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex -space-x-1.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyWorkspaces = () => (
  <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
    <div className="relative h-20 w-32 mx-auto mb-6">
      <div className="absolute inset-0 rounded-lg border border-stone-200 bg-white shadow-sm transform -rotate-[4deg] -translate-x-2" />
      <div className="absolute inset-0 rounded-lg border border-stone-200 bg-white shadow-sm transform rotate-[2deg] translate-x-1" />
      <div className="absolute inset-0 rounded-lg border border-stone-200 bg-white shadow-card flex items-center justify-center">
        <Plus className="h-6 w-6 text-stone-300" />
      </div>
    </div>
    <h3 className="text-sm font-semibold text-stone-900">Create your first workspace</h3>
    <p className="text-sm text-stone-500 mt-1.5 max-w-sm mx-auto">
      Workspaces are where your team collaborates. Create one for your project, thesis, or team — and invite your colleagues.
    </p>
    <Link to="/workspaces/new">
      <button className="mt-5 h-9 px-5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 mx-auto">
        <Plus className="h-4 w-4" />
        Create workspace
      </button>
    </Link>
  </div>
);
