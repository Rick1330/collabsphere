import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  CountChip,
  MetaStat,
  MetaDivider,
} from "@/components/shared/page-header";
import { GeneralTab } from "./general-tab";
import { MembersTab } from "./members-tab";
import { DangerTab } from "./danger-tab";
import {
  workspaceStore,
  type StoredWorkspace,
  type StoredWorkspaceType,
} from "@/features/workspace/store/workspace-store";
import { fetchMembers } from "@/api/adapters/members";

interface WorkspaceSettingsData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: StoredWorkspaceType;
  status: "active" | "archived";
  permissions: {
    canEditSettings: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}

interface WorkspaceSettingsProps {
  workspaceId: string;
  fallback: {
    name: string;
    description?: string;
    icon?: string;
    type: StoredWorkspaceType;
    status: "active" | "archived";
  };
  myRole: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
  initialTab?: TabKey;
}

const buildSettings = (
  workspaceId: string,
  fallback: WorkspaceSettingsProps["fallback"],
  myRole: WorkspaceSettingsProps["myRole"],
  stored?: StoredWorkspace,
): WorkspaceSettingsData => {
  const isOwner = myRole === "OWNER";
  const isAdminPlus = isOwner || myRole === "ADMIN";
  return {
    id: workspaceId,
    name: stored?.name ?? fallback.name,
    description: stored?.description ?? fallback.description,
    icon: stored?.icon ?? fallback.icon,
    type: stored?.type ?? fallback.type,
    status: stored?.status ?? fallback.status,
    permissions: {
      canEditSettings: isAdminPlus,
      canArchive: isAdminPlus,
      canDelete: isOwner,
    },
  };
};

type TabKey = "general" | "members" | "danger";

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tone?: "danger";
}> = [
  {
    key: "general",
    label: "General",
    icon: SettingsIcon,
    description: "Identity & branding",
  },
  {
    key: "members",
    label: "Members",
    icon: Users,
    description: "Roles & invitations",
  },
  {
    key: "danger",
    label: "Danger zone",
    icon: AlertTriangle,
    description: "Archive · transfer · delete",
    tone: "danger",
  },
];

export const WorkspaceSettings = ({
  workspaceId,
  fallback,
  myRole,
  initialTab = "general",
}: WorkspaceSettingsProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const {
    data: workspace,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workspace-settings", workspaceId, refreshKey],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      const stored = workspaceStore.getById({ workspaceId });
      return buildSettings(workspaceId, fallback, myRole, stored);
    },
  });

  const { data: memberCount } = useQuery({
    queryKey: ["workspace", workspaceId, "members-count"],
    queryFn: async () => {
      const res = await fetchMembers(workspaceId);
      return res.data.items.length;
    },
  });

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (workspace && !workspace.permissions.canEditSettings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-10 max-w-md text-center">
          <div className="h-12 w-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6 text-stone-400" aria-hidden="true" />
          </div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400 mt-4">
            Permission denied
          </p>
          <h2 className="text-base font-semibold text-stone-900 mt-1.5">
            Workspace settings are restricted
          </h2>
          <p className="text-sm text-stone-500 mt-1.5">
            Only Admins and Owners can configure this workspace. Ask a workspace Admin
            to grant you the right role if you need access.
          </p>
        </div>
      </div>
    );
  }

  const showDangerTab =
    !!workspace &&
    (workspace.permissions.canArchive || workspace.permissions.canDelete);

  const visibleTabs = TABS.filter((t) => (t.key === "danger" ? showDangerTab : true));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        variant="contextual"
        eyebrow="Workspace settings"
        title={workspace?.name ?? "Workspace settings"}
        description="Identity, governance, and the permanent actions only Admins and Owners can take."
        icon={
          <span className="text-[20px]" aria-hidden="true">
            {workspace?.icon ?? "⚙️"}
          </span>
        }
        badges={
          workspace ? (
            <>
              <CountChip
                value={workspace.type.toUpperCase()}
                tone={workspace.type === "professional" ? "teal" : workspace.type === "academic" ? "amber" : "neutral"}
                label="workspace type"
              />
              {workspace.status === "archived" && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Archived
                </span>
              )}
            </>
          ) : null
        }
        meta={
          workspace ? (
            <>
              <MetaStat label="your role" value={myRole} />
              <MetaDivider />
              <MetaStat label="members" value={memberCount ?? "…"} />
              <MetaDivider />
              <MetaStat
                label={workspace.permissions.canDelete ? "owner-only actions enabled" : "admin-only actions enabled"}
              />
            </>
          ) : null
        }
      />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full max-w-xs rounded-lg" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center">
          <AlertCircle className="h-6 w-6 text-red-400 mx-auto" aria-hidden="true" />
          <p className="text-sm font-semibold text-stone-900 mt-3">
            Couldn't load workspace settings
          </p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 h-8 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && workspace && (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-8">
          {/* Left rail: section nav */}
          <nav aria-label="Workspace settings sections" className="lg:sticky lg:top-4 self-start">
            <ul className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0">
              {visibleTabs.map((t) => {
                const active = activeTab === t.key;
                const Icon = t.icon;
                const isDanger = t.tone === "danger";
                return (
                  <li key={t.key} className="flex-shrink-0 lg:flex-shrink">
                    <button
                      type="button"
                      onClick={() => setActiveTab(t.key)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors text-left",
                        active && !isDanger &&
                          "bg-white border border-stone-200 text-stone-900 font-semibold shadow-sm",
                        active && isDanger &&
                          "bg-white border border-red-200 text-red-700 font-semibold shadow-sm",
                        !active && !isDanger &&
                          "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 border border-transparent",
                        !active && isDanger &&
                          "text-red-600/70 hover:text-red-700 hover:bg-red-50/40 border border-transparent",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isDanger
                            ? active ? "text-red-600" : "text-red-500/70"
                            : active ? "text-stone-700" : "text-stone-400",
                        )}
                      />
                      <span className="flex flex-col min-w-0 leading-tight">
                        <span className="truncate">{t.label}</span>
                        <span
                          className={cn(
                            "hidden lg:block text-[10.5px] mt-0.5 font-normal",
                            isDanger ? "text-red-500/60" : "text-stone-400",
                          )}
                        >
                          {t.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right pane */}
          <div className="min-w-0">
            {activeTab === "general" && (
              <GeneralTab
                workspaceId={workspaceId}
                workspace={{
                  name: workspace.name,
                  description: workspace.description,
                  icon: workspace.icon,
                  type: workspace.type,
                }}
                onSaved={refresh}
              />
            )}
            {activeTab === "members" && (
              <MembersTab workspaceId={workspaceId} memberCount={memberCount} />
            )}
            {activeTab === "danger" && showDangerTab && (
              <DangerTab
                workspaceId={workspaceId}
                workspace={{
                  name: workspace.name,
                  status: workspace.status,
                  permissions: {
                    canArchive: workspace.permissions.canArchive,
                    canDelete: workspace.permissions.canDelete,
                  },
                }}
                onChanged={refresh}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
