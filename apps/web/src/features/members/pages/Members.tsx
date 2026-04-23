import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import {
  WorkspaceSidebar,
  type WorkspaceForSidebar,
} from "@/features/workspace/components/workspace-sidebar";
import { MemberList } from "@/features/members/components/member-list";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import type { WorkspaceRole } from "@/api/adapters/members";
import { usePersonaState } from "@/lib/persona-scenario";
import { useCurrentAccount } from "@/lib/auth-session";

const CURRENT_USER_ID = "user-jane";
const MOCK_USER = {
  fullName: "Elshaday Tesfaye",
  email: "jane@collabsphere.app",
};

type WorkspaceWithRole = WorkspaceForSidebar & { myRole: WorkspaceRole };

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

// Map persona role keys to the WorkspaceRole the members slice consumes.
const PERSONA_TO_MEMBER_ROLE: Record<string, WorkspaceRole> = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
  STUDENT: "MEMBER",
  SUPERVISOR: "MANAGER",
};

const Members = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
  const account = useCurrentAccount();
  const personaState = usePersonaState();

  const workspace = useMemo(() => {
    const base =
      (workspaceId && WORKSPACES[workspaceId]) || {
        ...FALLBACK,
        id: workspaceId || "alpha",
      };
    const myRole = PERSONA_TO_MEMBER_ROLE[personaState.workspaceRole] ?? base.myRole;
    return {
      ...base,
      type: personaState.workspaceType,
      status: personaState.scenario === "archived" ? ("archived" as const) : base.status,
      myRole,
    } satisfies WorkspaceWithRole;
  }, [workspaceId, personaState]);

  useEffect(() => {
    document.title = `Members — ${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  const currentUser = account
    ? { fullName: account.fullName, email: account.email }
    : { fullName: "Guest", email: "" };

  return (
    <div className="app-light min-h-screen flex bg-stone-50">
      <WorkspaceSidebar
        workspace={workspace}
        collapsed={collapsed}
        onToggle={toggle}
      />

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <TopNav user={currentUser} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <MemberList
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            workspaceStatus={workspace.status}
            currentUserId={CURRENT_USER_ID}
            currentUserRole={workspace.myRole}
          />
        </main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default Members;
