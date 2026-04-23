import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FilePlus,
  FolderPlus,
  Folder,
  FileText,
  Sparkles,
  LayoutTemplate,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import {
  WorkspaceSidebar,
  type WorkspaceForSidebar,
} from "@/features/workspace/components/workspace-sidebar";
import {
  DocumentTree,
  type TreeNode,
} from "@/features/documents/components/document-tree";
import { useDocumentTree } from "@/features/documents/hooks/use-document-tree";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { CountChip, MetaStat, PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

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

const Documents = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();

  const workspace = useMemo(
    () => (workspaceId && WORKSPACES[workspaceId]) || { ...FALLBACK, id: workspaceId || "alpha" },
    [workspaceId],
  );

  const canCreate =
    workspace.permissions.canCreateContent && workspace.status === "active";

  const { tree, state: treeState } = useDocumentTree(workspace.id);

  // Compute richer stats from the tree for the hero strip.
  const stats = useMemo(() => {
    let folders = 0;
    let docs = 0;
    let approved = 0;
    let pending = 0;
    let drafts = 0;
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.type === "folder") {
          folders++;
          walk(n.children);
        } else {
          docs++;
          if (n.status === "approved") approved++;
          else if (n.status === "submitted" || n.status === "changes_requested") pending++;
          else if (n.status === "draft") drafts++;
        }
      }
    };
    walk(tree);
    return { folders, docs, approved, pending, drafts };
  }, [tree]);

  useEffect(() => {
    document.title = `Documents — ${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  return (
    <div className="app-light min-h-screen flex">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto w-full">
          <PageHeader
            variant="contextual"
            eyebrow={workspace.name}
            title="Documents"
            description="Folders, drafts, and approved docs — organized in a tree you can rearrange."
            icon={<Folder className="h-5 w-5 text-stone-500" />}
            badges={
              treeState === "loaded" ? (
                <CountChip value={tree.length} label={`${tree.length} root nodes`} />
              ) : undefined
            }
            actions={
              canCreate ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const ev = new CustomEvent("documents:new-folder");
                      window.dispatchEvent(ev);
                    }}
                    className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
                  >
                    <FolderPlus className="h-4 w-4 text-stone-500" />
                    <span className="hidden sm:inline">New folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ev = new CustomEvent("documents:new-doc");
                      window.dispatchEvent(ev);
                    }}
                    className="h-9 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white transition-colors duration-150 flex items-center gap-1.5 shadow-sm"
                  >
                    <FilePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">New document</span>
                  </button>
                </>
              ) : undefined
            }
            meta={
              <>
                <MetaStat icon={Folder} label="tree view" />
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-stone-400">
                  Drag to reorder · Right-click for actions
                </span>
              </>
            }
            className="mb-6"
          />

          {/* Stats hero — gives the page editorial weight + at-a-glance state.
              Uses solid bg-white + bg-teal-50 chip so dark-mode overrides catch
              every surface (gradient stops can't be remapped). */}
          {treeState === "loaded" && (
            <section
              aria-label="Document library overview"
              className="mb-6 sm:mb-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 lg:p-7 overflow-hidden relative shadow-sm"
            >
              {/* Decorative ambient glow — pure tint so dark mode reads as teal halo */}
              <div
                aria-hidden
                className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-teal-100 opacity-40 blur-3xl pointer-events-none"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent pointer-events-none"
              />

              <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-cs-pulse"
                    />
                    <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-teal-700 font-semibold">
                      Library
                    </p>
                  </div>
                  <h2 className="text-[19px] sm:text-[22px] font-bold text-stone-900 tracking-tight mt-2 leading-tight">
                    {stats.docs === 0
                      ? "Start your first document"
                      : `${stats.docs} document${stats.docs === 1 ? "" : "s"} across ${stats.folders} folder${stats.folders === 1 ? "" : "s"}`}
                  </h2>
                  <p className="text-[13px] sm:text-sm text-stone-500 mt-2 max-w-xl leading-relaxed">
                    Organize folders, draft and submit work, and track approvals — all
                    from one tree. Drag to reorder, right-click for actions.
                  </p>
                  {canCreate && stats.docs === 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent("documents:new-doc"))}
                        className="h-9 px-3.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <FilePlus className="h-3.5 w-3.5" />
                        Create first document
                      </button>
                      <Link
                        to={`/w/${workspace.id}/templates`}
                        className="h-9 px-3.5 rounded-lg border border-stone-200 bg-white text-stone-700 text-[13px] font-medium hover:bg-stone-50 hover:border-stone-300 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <LayoutTemplate className="h-3.5 w-3.5 text-stone-500" />
                        Browse templates
                      </Link>
                    </div>
                  )}
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full lg:w-[440px] flex-shrink-0">
                  <DocStat
                    icon={<FileText className="h-3.5 w-3.5" />}
                    label="Documents"
                    value={stats.docs}
                    tone="stone"
                  />
                  <DocStat
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    label="Drafts"
                    value={stats.drafts}
                    tone="stone"
                  />
                  <DocStat
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label="In review"
                    value={stats.pending}
                    tone="amber"
                  />
                  <DocStat
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    label="Approved"
                    value={stats.approved}
                    tone="emerald"
                  />
                </dl>
              </div>
            </section>
          )}
          {workspace.status === "archived" && (
            <div
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-4"
            >
              <p className="text-sm font-semibold text-stone-900">
                This workspace is archived
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                All documents are read-only. New folders and documents cannot be created.
              </p>
            </div>
          )}

          {treeState === "loading" && (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          )}

          {treeState === "loaded" && (
            <DocumentTreeWithHeaderActions
              workspaceId={workspace.id}
              initialTree={tree}
              canCreate={canCreate}
            />
          )}

          {treeState === "error" && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50/40 p-4 text-sm text-red-700">
              Couldn't load the document tree. Try refreshing the page.
            </div>
          )}
        </main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

// Tiny wrapper that listens to header-button custom events so the header can
// trigger root-level "new doc" / "new folder" without prop-drilling state up.
const DocumentTreeWithHeaderActions = ({
  workspaceId,
  initialTree,
  canCreate,
}: {
  workspaceId: string;
  initialTree: TreeNode[];
  canCreate: boolean;
}) => {
  const [autoOpen, setAutoOpen] = useState<"doc" | "folder" | null>(null);

  useEffect(() => {
    const onDoc = () => setAutoOpen("doc");
    const onFolder = () => setAutoOpen("folder");
    window.addEventListener("documents:new-doc", onDoc);
    window.addEventListener("documents:new-folder", onFolder);
    return () => {
      window.removeEventListener("documents:new-doc", onDoc);
      window.removeEventListener("documents:new-folder", onFolder);
    };
  }, []);

  return (
    <DocumentTree
      key={workspaceId}
      workspaceId={workspaceId}
      initialTree={initialTree}
      canCreate={canCreate}
      // expose imperative trigger via prop
      autoOpen={autoOpen}
      onAutoOpenHandled={() => setAutoOpen(null)}
    />
  );
};

/* ─────────── Local stat tile for the documents hero ─────────── */

const DocStat = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "stone" | "amber" | "emerald";
}) => {
  const valueCls =
    tone === "amber"
      ? "text-amber-700"
      : tone === "emerald"
        ? "text-emerald-700"
        : "text-stone-900";
  const iconCls =
    tone === "amber"
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : tone === "emerald"
        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
        : "text-stone-500 bg-stone-50 border-stone-200";
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 flex items-center gap-2.5">
      <span
        className={`h-7 w-7 rounded-md border flex items-center justify-center flex-shrink-0 ${iconCls}`}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-stone-500">
          {label}
        </div>
        <div className={`font-mono tabular-nums text-[16px] font-semibold leading-tight ${valueCls}`}>
          {value}
        </div>
      </div>
    </div>
  );
};

export default Documents;
