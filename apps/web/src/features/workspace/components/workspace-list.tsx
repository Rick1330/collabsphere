import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, FolderKanban, Plus, RefreshCw, Search, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WorkspaceCard, type WorkspaceSummary } from "./workspace-card";
import { useStoredWorkspaces, workspaceStore } from "@/features/workspace/store/workspace-store";
import { CountChip, MetaDivider, MetaStat, PageHeader } from "@/components/shared/page-header";

type State = "loading" | "loaded" | "empty" | "error";

const MOCK_WORKSPACES: WorkspaceSummary[] = [
  {
    id: "alpha",
    name: "Project Alpha",
    description: "Q4 product launch & GTM coordination",
    type: "professional",
    status: "active",
    docs: 24,
    tasks: 12,
    memberCount: 8,
    recentMembers: [
      { id: "1", fullName: "Elshaday Tesfaye" },
      { id: "2", fullName: "Marco Silva" },
      { id: "3", fullName: "Aiko Tanaka" },
      { id: "4", fullName: "Priya Reddy" },
    ],
    roleLabel: "OWNER",
    lastAccessedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    isAdminOrOwner: true,
  },
  {
    id: "senior-project",
    name: "Senior Project",
    description: "Final year thesis workspace for systems research",
    type: "academic",
    status: "active",
    docs: 6,
    tasks: 3,
    memberCount: 4,
    recentMembers: [
      { id: "5", fullName: "Sasha Chen" },
      { id: "6", fullName: "Marco Silva" },
      { id: "7", fullName: "Lukas Berger" },
    ],
    roleLabel: "STUDENT",
    lastAccessedAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    isAdminOrOwner: false,
  },
  {
    id: "design-ops",
    name: "Design Ops",
    description: "Component library & design tokens",
    type: "professional",
    status: "active",
    docs: 18,
    tasks: 9,
    memberCount: 6,
    recentMembers: [
      { id: "8", fullName: "Sasha Lee" },
      { id: "9", fullName: "Diego Martín" },
      { id: "10", fullName: "Nora Khan" },
    ],
    roleLabel: "EDITOR",
    lastAccessedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    isAdminOrOwner: true,
  },
  {
    id: "client-q4",
    name: "Client Project",
    description: "Q4 website redesign for Acme Corp",
    type: "professional",
    status: "active",
    docs: 4,
    tasks: 12,
    memberCount: 3,
    recentMembers: [
      { id: "11", fullName: "Elshaday Tesfaye" },
      { id: "12", fullName: "Ben Kim" },
    ],
    roleLabel: "DEVELOPER",
    lastAccessedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    isAdminOrOwner: false,
  },
  {
    id: "side-quest",
    name: "Side Quest",
    description: "Weekend hack project",
    type: "general",
    status: "active",
    docs: 1,
    tasks: 0,
    memberCount: 1,
    recentMembers: [{ id: "13", fullName: "Elshaday Tesfaye" }],
    roleLabel: "OWNER",
    lastAccessedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    isAdminOrOwner: true,
  },
  {
    id: "research-group",
    name: "Research Group",
    description: "ML paper collab",
    type: "academic",
    status: "archived",
    docs: 8,
    tasks: 2,
    memberCount: 5,
    recentMembers: [
      { id: "14", fullName: "Sasha Chen" },
      { id: "15", fullName: "Aiko Tanaka" },
    ],
    roleLabel: "REVIEWER",
    lastAccessedAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    isAdminOrOwner: true,
  },
];

export const WorkspaceList = () => {
  const [state] = useState<State>("loaded");
  const [searchQuery, setSearchQuery] = useState("");
  const stored = useStoredWorkspaces();
  const [overrides, setOverrides] = useState<Record<string, "active" | "archived">>({});

  // Merge user-created workspaces (from store) with mock workspaces.
  // Stored ones come first so the freshly created workspace shows at top.
  const workspaces = useMemo<WorkspaceSummary[]>(() => {
    const fromStore: WorkspaceSummary[] = stored.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      type: w.type,
      status: overrides[w.id] ?? w.status,
      icon: w.icon,
      docs: 0,
      tasks: 0,
      memberCount: 1,
      recentMembers: [{ id: "self", fullName: "Elshaday Tesfaye" }],
      roleLabel: w.roleLabel,
      lastAccessedAt: w.lastAccessedAt,
      isAdminOrOwner: true,
    }));
    const mocks = MOCK_WORKSPACES.map((w) => ({
      ...w,
      status: overrides[w.id] ?? w.status,
    }));
    return [...fromStore, ...mocks];
  }, [stored, overrides]);

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    const q = searchQuery.toLowerCase().trim();
    return workspaces.filter(
      (ws) =>
        ws.name.toLowerCase().includes(q) ||
        ws.description?.toLowerCase().includes(q) ||
        ws.type.toLowerCase().includes(q) ||
        ws.roleLabel.toLowerCase().includes(q),
    );
  }, [workspaces, searchQuery]);

  const sortedWorkspaces = useMemo(() => {
    return [...filteredWorkspaces].sort((a, b) => {
      if (a.status === "archived" && b.status !== "archived") return 1;
      if (a.status !== "archived" && b.status === "archived") return -1;
      return (
        new Date(b.lastAccessedAt).getTime() -
        new Date(a.lastAccessedAt).getTime()
      );
    });
  }, [filteredWorkspaces]);

  const isEmpty = state === "loaded" && workspaces.length === 0;
  const showSearch = state === "loaded" && workspaces.length > 0;

  const handleArchive = (workspace: WorkspaceSummary) => {
    if (
      !confirm(
        `Archive "${workspace.name}"? It will become read-only for all members.`,
      )
    )
      return;
    if (stored.some((s) => s.id === workspace.id)) {
      workspaceStore.setStatus(workspace.id, "archived");
    } else {
      setOverrides((prev) => ({ ...prev, [workspace.id]: "archived" }));
    }
    toast.success(`"${workspace.name}" archived`);
  };

  const handleUnarchive = (workspace: WorkspaceSummary) => {
    if (stored.some((s) => s.id === workspace.id)) {
      workspaceStore.setStatus(workspace.id, "active");
    } else {
      setOverrides((prev) => ({ ...prev, [workspace.id]: "active" }));
    }
    toast.success(`"${workspace.name}" unarchived`);
  };

  const activeCount = workspaces.filter((w) => w.status === "active").length;
  const archivedCount = workspaces.filter((w) => w.status === "archived").length;
  const ownedCount = workspaces.filter((w) => w.isAdminOrOwner).length;

  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto w-full">
      <PageHeader
        variant="index"
        eyebrow="Your work"
        title="Workspaces"
        description="Every space you can enter — owned, joined, and archived. Switch contexts anytime with ⌘W."
        badges={
          state === "loaded" && workspaces.length > 0 ? (
            <CountChip
              value={workspaces.length}
              label={`${workspaces.length} workspaces total`}
            />
          ) : undefined
        }
        actions={
          <>
            {showSearch && (
              <div className="relative w-full sm:w-72">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workspaces..."
                  aria-label="Search workspaces"
                  className="w-full h-9 pl-9 pr-8 rounded-lg text-sm
                    bg-white border border-stone-200
                    text-stone-900 placeholder:text-stone-400
                    focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20
                    focus:outline-none transition-all duration-150"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2
                      h-5 w-5 rounded-full bg-stone-100 hover:bg-stone-200
                      flex items-center justify-center transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3 text-stone-500" />
                  </button>
                )}
              </div>
            )}

            <Link to="/workspaces/new" className="flex-shrink-0">
              <button
                type="button"
                className="h-9 px-3 sm:px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium
                  transition-colors duration-150 flex items-center gap-2 shadow-sm
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New workspace</span>
              </button>
            </Link>
          </>
        }
        meta={
          state === "loaded" && workspaces.length > 0 ? (
            <>
              <MetaStat icon={FolderKanban} value={activeCount} label="active" />
              {archivedCount > 0 && (
                <>
                  <MetaDivider />
                  <MetaStat label="archived" value={archivedCount} />
                </>
              )}
              <MetaDivider />
              <MetaStat icon={Users} value={ownedCount} label="you own" />
              <MetaDivider />
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-stone-400">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Sorted by recent
              </span>
            </>
          ) : undefined
        }
      />

      {/* SR-only result announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {searchQuery
          ? `${filteredWorkspaces.length} workspace${filteredWorkspaces.length !== 1 ? "s" : ""} matching "${searchQuery}"`
          : `${workspaces.length} workspaces`}
      </div>

      <div className="mt-8">
        {state === "loading" && <LoadingGrid />}
        {state === "error" && <ErrorState onRetry={() => {}} />}
        {isEmpty && <EmptyWorkspaces />}
        {state === "loaded" && !isEmpty && sortedWorkspaces.length === 0 && (
          <EmptySearch query={searchQuery} onClear={() => setSearchQuery("")} />
        )}
        {state === "loaded" && sortedWorkspaces.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedWorkspaces.map((w) => (
              <WorkspaceCard
                key={w.id}
                workspace={w}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

const LoadingGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-busy="true">
    {Array.from({ length: 6 }).map((_, i) => (
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
  <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 items-stretch">
    {/* Authored composition: a faux-workspace card sketch sitting next to the CTA.
        Tied directly to the loaded WorkspaceCard layout so the empty state
        previews what the user is about to create. */}
    <div className="relative rounded-xl border border-stone-200/80 bg-white p-6 overflow-hidden">
      <div
        className="absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(13,148,136,0.08), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <span className="font-mono text-[10px] text-stone-400 tracking-[0.2em] uppercase">
        First workspace
      </span>
      <h3
        className="mt-3 text-[22px] leading-[1.15] tracking-[-0.015em] text-stone-900"
        style={{ fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" }}
      >
        A workspace is where your team's docs, tasks, and conversations live.
      </h3>
      <p className="text-sm text-stone-500 mt-3 leading-relaxed">
        Pick a template — or start blank — and you can invite teammates,
        connect tools, and shape the structure as you go.
      </p>
      <Link to="/workspaces/new" className="inline-block mt-5">
        <button className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create your first workspace
        </button>
      </Link>
    </div>

    {/* Right side: a stack of dimmed example cards that mirror the real card grid. */}
    <div
      className="relative rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-5 hidden lg:flex flex-col gap-3 overflow-hidden"
      aria-hidden="true"
    >
      <span className="font-mono text-[10px] text-stone-400 tracking-[0.2em] uppercase">
        Preview
      </span>
      {[
        { name: "Project Alpha", tone: "teal" },
        { name: "Thesis", tone: "amber" },
        { name: "Personal", tone: "stone" },
      ].map((s) => (
        <div
          key={s.name}
          className="rounded-lg border border-stone-200 bg-white/70 p-3 flex items-center gap-3"
        >
          <div
            className={cn(
              "h-8 w-8 rounded-lg border flex items-center justify-center text-xs font-bold",
              s.tone === "teal" && "bg-teal-50/70 border-teal-200/70 text-teal-700/70",
              s.tone === "amber" && "bg-amber-50/70 border-amber-200/70 text-amber-700/70",
              s.tone === "stone" && "bg-stone-100/70 border-stone-200/70 text-stone-500",
            )}
          >
            {s.name.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-2.5 w-3/4 rounded bg-stone-200/70" />
            <div className="h-2 w-1/2 rounded bg-stone-100 mt-1.5" />
          </div>
          <div className="flex -space-x-1">
            <div className="h-5 w-5 rounded-full bg-stone-200/80 border-2 border-white" />
            <div className="h-5 w-5 rounded-full bg-stone-300/70 border-2 border-white" />
          </div>
        </div>
      ))}
      <div className="h-px bg-stone-200/70 my-1" />
      <p className="text-[11px] text-stone-400 italic">
        Your workspaces will appear here.
      </p>
    </div>
  </div>
);

const EmptySearch = ({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) => (
  <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-8 sm:p-12 text-center">
    <div
      className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto"
      aria-hidden="true"
    >
      <Search className="h-5 w-5 text-stone-400" />
    </div>
    <h3 className="text-sm font-semibold text-stone-900 mt-4">No matches</h3>
    <p className="text-sm text-stone-500 mt-1.5 max-w-sm mx-auto">
      No workspaces match <span className="font-semibold text-stone-700">"{query}"</span>.
      Try a different search term.
    </p>
    <button
      type="button"
      onClick={onClear}
      className="mt-4 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded"
    >
      Clear search
    </button>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div
    role="alert"
    className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center"
  >
    <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
    <p className="text-sm text-stone-700 mt-2 font-medium">
      Couldn't load workspaces
    </p>
    <p className="text-xs text-stone-500 mt-1 font-mono">
      Request ID: req_4f8a2c9d
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-3 h-8 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700
        hover:bg-stone-50 transition-colors flex items-center gap-2 mx-auto
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Try again
    </button>
  </div>
);
