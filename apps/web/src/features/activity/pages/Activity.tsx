import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import {
  WorkspaceSidebar,
  type WorkspaceForSidebar,
} from "@/features/workspace/components/workspace-sidebar";
import { ActivityFeed } from "@/features/activity/components/activity-feed";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";

const MOCK_USER = {
  fullName: "Elshaday Tesfaye",
  email: "jane@collabsphere.app",
};

const WORKSPACES: Record<string, WorkspaceForSidebar> = {
  alpha: {
    id: "alpha",
    name: "Project Alpha",
    description: "Building the next-gen collaboration platform.",
    icon: "📦",
    type: "professional",
    roleLabel: "TECH LEAD",
    status: "active",
    permissions: {
      canCreateContent: true,
      canEditSettings: true,
      canViewAnalytics: true,
    },
  },
  thesis: {
    id: "thesis",
    name: "Thesis — Distributed Systems",
    description: "Final year research workspace.",
    icon: "🎓",
    type: "academic",
    roleLabel: "STUDENT",
    status: "active",
    permissions: {
      canCreateContent: true,
      canEditSettings: false,
      canViewAnalytics: false,
    },
  },
  personal: {
    id: "personal",
    name: "Personal Notes",
    description: "Private notebook for ideas and drafts.",
    icon: "📝",
    type: "general",
    roleLabel: "OWNER",
    status: "active",
    permissions: {
      canCreateContent: true,
      canEditSettings: true,
      canViewAnalytics: false,
    },
  },
  research: {
    id: "research",
    name: "Research Group",
    description: "ML paper collaboration workspace.",
    icon: "🔬",
    type: "academic",
    roleLabel: "REVIEWER",
    status: "archived",
    permissions: {
      canCreateContent: false,
      canEditSettings: true,
      canViewAnalytics: false,
    },
  },
};

const FALLBACK = WORKSPACES.alpha;

const Activity = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();

  const workspace = useMemo(
    () =>
      (workspaceId && WORKSPACES[workspaceId]) || {
        ...FALLBACK,
        id: workspaceId || "alpha",
      },
    [workspaceId],
  );

  useEffect(() => {
    document.title = `Activity — ${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  return (
    <div className="app-light min-h-screen flex bg-stone-50">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="flex-1 min-h-0 overflow-y-auto">
          <ActivityFeed workspaceId={workspace.id} />
        </main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default Activity;
