import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { WorkspaceSidebar, type WorkspaceForSidebar } from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceHome as WorkspaceHomeContent } from "@/features/workspace/components/workspace-home";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useStoredWorkspaces, workspaceStore } from "@/features/workspace/store/workspace-store";
import {
  WORKSPACE_ROLE_META,
  getRolePermissions,
  usePersonaState,
} from "@/lib/persona-scenario";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };

const WORKSPACES: Record<string, WorkspaceForSidebar & { memberCount: number }> = {
  alpha: {
    id: "alpha",
    name: "Project Alpha",
    description: "Building the next-gen collaboration platform.",
    icon: "📦",
    type: "professional",
    roleLabel: "TECH LEAD",
    status: "active",
    memberCount: 6,
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
    memberCount: 4,
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
    memberCount: 1,
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
    memberCount: 5,
    permissions: { canCreateContent: false, canEditSettings: true, canViewAnalytics: false },
  },
};

const FALLBACK = WORKSPACES.alpha;

const WorkspaceHomePage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
  const stored = useStoredWorkspaces();

  const persona = usePersonaState();

  const fromStore = useMemo(
    () => (workspaceId ? stored.find((w) => w.id === workspaceId) : undefined),
    [workspaceId, stored],
  );

  const workspace = useMemo(() => {
    const base = (() => {
      if (!workspaceId) return { ...FALLBACK, id: "alpha" };
      if (WORKSPACES[workspaceId]) return WORKSPACES[workspaceId];
      if (fromStore) {
        return {
          id: fromStore.id,
          name: fromStore.name,
          description: fromStore.description || "Your new workspace.",
          icon: fromStore.icon || "✨",
          type: fromStore.type,
          roleLabel: fromStore.roleLabel,
          status: fromStore.status,
          memberCount: 1,
          permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
        } satisfies WorkspaceForSidebar & { memberCount: number };
      }
      return { ...FALLBACK, id: workspaceId };
    })();
    // Persona overlay: let the demo switcher drive role label, type, status, perms.
    return {
      ...base,
      type: persona.workspaceType,
      roleLabel: WORKSPACE_ROLE_META[persona.workspaceRole].label.toUpperCase(),
      status: persona.scenario === "archived" ? ("archived" as const) : base.status,
      permissions: getRolePermissions(persona.workspaceRole),
    };
  }, [workspaceId, fromStore, persona]);

  useEffect(() => {
    document.title = `${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  useEffect(() => {
    if (workspaceId && workspaceStore.getById(workspaceId)) {
      workspaceStore.touch(workspaceId);
    }
  }, [workspaceId]);

  return (
    <div className="app-light min-h-screen flex">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />
        <WorkspaceHomeContent
          workspace={workspace}
          templateName={fromStore?.templateName ?? null}
        />
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default WorkspaceHomePage;
