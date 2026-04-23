import { useEffect, useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import {
  WorkspaceSidebar,
  type WorkspaceForSidebar,
} from "@/features/workspace/components/workspace-sidebar";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };

type WorkspaceWithRole = WorkspaceForSidebar & {
  myRole: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
};

const WORKSPACES: Record<string, WorkspaceWithRole> = {
  alpha: {
    id: "alpha",
    name: "Project Alpha",
    description: "Building the next-gen collaboration platform.",
    icon: "📦",
    type: "professional",
    roleLabel: "TECH LEAD",
    status: "active",
    myRole: "ADMIN",
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
    myRole: "MEMBER",
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
    myRole: "OWNER",
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
    myRole: "MEMBER",
    permissions: {
      canCreateContent: false,
      canEditSettings: true,
      canViewAnalytics: false,
    },
  },
};

const FALLBACK = WORKSPACES.alpha;

const Tasks = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
  const isMobile = useIsMobile();

  const workspace = useMemo(
    () =>
      (workspaceId && WORKSPACES[workspaceId]) || {
        ...FALLBACK,
        id: workspaceId || "alpha",
      },
    [workspaceId],
  );

  useEffect(() => {
    document.title = `Tasks — ${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  // Spec: list is the preferred mobile task view. Redirect AFTER hooks
  // are declared so hook order stays stable across renders.
  if (isMobile && workspaceId) {
    return <Navigate to={`/w/${workspaceId}/tasks/list`} replace />;
  }

  return (
    <div className="app-light min-h-screen flex bg-stone-50">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="flex-1 min-h-0 flex flex-col">
          <TaskBoard
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            workspaceStatus={workspace.status}
            myRole={workspace.myRole}
          />
        </main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default Tasks;
