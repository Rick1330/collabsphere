import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Construction } from "lucide-react";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import {
  WorkspaceSidebar,
  type WorkspaceForSidebar,
} from "@/features/workspace/components/workspace-sidebar";
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
    permissions: { canCreateContent: false, canEditSettings: true, canViewAnalytics: false },
  },
};

const FALLBACK = WORKSPACES.alpha;

interface WorkspaceComingSoonProps {
  title: string;
  description: string;
}

export const WorkspaceComingSoon = ({ title, description }: WorkspaceComingSoonProps) => {
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
    document.title = `${title} — ${workspace.name} — CollabSphere`;
  }, [workspace.name, title]);

  return (
    <div className="app-light min-h-screen flex bg-stone-50">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
                <Construction className="h-6 w-6 text-amber-600" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold text-stone-900 mt-5 tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto leading-relaxed">
                {description}
              </p>
              <Link
                to={`/w/${workspace.id}`}
                className="inline-flex items-center gap-1.5 mt-6 h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Back to overview
              </Link>
            </div>
          </div>
        </main>
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default WorkspaceComingSoon;
