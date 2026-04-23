import { useEffect, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import {
  WorkspaceSidebar,
  type WorkspaceForSidebar,
} from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceSettings } from "@/features/workspace/components/settings/workspace-settings";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useStoredWorkspaces } from "@/features/workspace/store/workspace-store";
import type { WorkspaceRole } from "@/api/adapters/members";
import { resolveWorkspaceParam } from "@/lib/route-params";

const MOCK_USER = {
  fullName: "Elshaday Tesfaye",
  email: "jane@collabsphere.app",
};

type WorkspaceWithRole = WorkspaceForSidebar & { myRole: WorkspaceRole };

const SEED_WORKSPACES: Record<string, WorkspaceWithRole> = {
  alpha: {
    id: "alpha",
    name: "Project Alpha",
    description: "Building the next-gen collaboration platform.",
    icon: "📦",
    type: "professional",
    roleLabel: "TECH LEAD",
    status: "active",
    myRole: "ADMIN",
    permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
  },
  thesis: {
    id: "thesis",
    name: "Thesis — Distributed Systems",
    description: "Final year research workspace.",
    icon: "🎓",
    type: "academic",
    roleLabel: "STUDENT",
    status: "active",
    myRole: "MEMBER",
    permissions: { canCreateContent: true, canEditSettings: false, canViewAnalytics: false },
  },
  personal: {
    id: "personal",
    name: "Personal Notes",
    description: "Private notebook for ideas and drafts.",
    icon: "📝",
    type: "general",
    roleLabel: "OWNER",
    status: "active",
    myRole: "OWNER",
    permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: false },
  },
  research: {
    id: "research",
    name: "Research Group",
    description: "ML paper collaboration workspace.",
    icon: "🔬",
    type: "academic",
    roleLabel: "REVIEWER",
    status: "archived",
    myRole: "MEMBER",
    permissions: { canCreateContent: false, canEditSettings: true, canViewAnalytics: false },
  },
};

const FALLBACK = SEED_WORKSPACES.alpha;

const WorkspaceSettingsPage = () => {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = resolveWorkspaceParam(params.workspaceId);
  const location = useLocation();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
  const stored = useStoredWorkspaces();

  const workspace = useMemo<WorkspaceWithRole>(() => {
    if (!workspaceId) return { ...FALLBACK, id: "alpha" };
    if (SEED_WORKSPACES[workspaceId]) return SEED_WORKSPACES[workspaceId];
    const s = stored.find((w) => w.id === workspaceId);
    if (s) {
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        icon: s.icon,
        type: s.type,
        roleLabel: s.roleLabel,
        status: s.status,
        myRole: "OWNER",
        permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
      };
    }
    return { ...FALLBACK, id: workspaceId };
  }, [workspaceId, stored]);

  useEffect(() => {
    document.title = `Settings — ${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  return (
    <div className="app-light min-h-screen flex bg-stone-50">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <WorkspaceSettings
            workspaceId={workspace.id}
            myRole={workspace.myRole}
            initialTab={location.pathname.endsWith("/settings/members") ? "members" : "general"}
            fallback={{
              name: workspace.name,
              description: workspace.description,
              icon: workspace.icon,
              type: workspace.type,
              status: workspace.status,
            }}
          />
        </main>
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default WorkspaceSettingsPage;
