import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Eye,
  Check,
  Sparkles,
  FileText,
  FolderTree,
  Layers,
  Settings as SettingsIcon,
  GraduationCap,
  Briefcase,
  Layout,
  LayoutTemplate,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Clock as ClockIcon,
} from "lucide-react";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { WorkspaceSidebar, type WorkspaceForSidebar } from "@/features/workspace/components/workspace-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useStoredWorkspaces } from "@/features/workspace/store/workspace-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  WORKSPACE_TEMPLATES,
  DOCUMENT_TEMPLATES,
  type WorkspaceTemplate,
  type DocumentTemplate,
} from "@/api/adapters/templates";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };

type TabKey = "workspace" | "document";

const FALLBACK_WS: WorkspaceForSidebar = {
  id: "alpha",
  name: "Project Alpha",
  description: "Building the next-gen collaboration platform.",
  icon: "📦",
  type: "professional",
  roleLabel: "TECH LEAD",
  status: "active",
  permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
};

const Templates = () => {
  const { workspaceId = "alpha" } = useParams<{ workspaceId: string }>();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
  const navigate = useNavigate();
  const stored = useStoredWorkspaces();

  const workspace = useMemo<WorkspaceForSidebar>(() => {
    const fromStore = stored.find((w) => w.id === workspaceId);
    if (fromStore) {
      return {
        id: fromStore.id,
        name: fromStore.name,
        description: fromStore.description || "",
        icon: fromStore.icon || "✨",
        type: fromStore.type,
        roleLabel: fromStore.roleLabel,
        status: fromStore.status,
        permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
      };
    }
    return { ...FALLBACK_WS, id: workspaceId };
  }, [workspaceId, stored]);

  const [tab, setTab] = useState<TabKey>("workspace");
  const [query, setQuery] = useState("");
  const [previewWs, setPreviewWs] = useState<WorkspaceTemplate | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Templates — ${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(t);
  }, [tab]);

  const wsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORKSPACE_TEMPLATES;
    return WORKSPACE_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.includes(q),
    );
  }, [query]);

  const docFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOCUMENT_TEMPLATES;
    return DOCUMENT_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.includes(q),
    );
  }, [query]);

  return (
    <div className="app-light min-h-screen flex">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto w-full">
          <PageHeader
            variant="contextual"
            eyebrow="Library"
            title="Templates"
            description="Browse the templates available in this workspace. Workspace templates seed a whole new workspace; document templates can be applied to a single doc."
            icon={<LayoutTemplate className="h-5 w-5 text-stone-700" />}
          />

          {/* Tabs + search */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div
              role="tablist"
              aria-label="Template type"
              className="inline-flex items-center gap-1 p-1 rounded-lg border border-stone-200 bg-white shadow-sm w-fit"
            >
              {([
                { key: "workspace", label: "Workspace templates", count: WORKSPACE_TEMPLATES.length },
                { key: "document", label: "Document templates", count: DOCUMENT_TEMPLATES.length },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "px-3 h-8 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2",
                    tab === t.key
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-50",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded",
                      tab === t.key
                        ? "bg-white/15 text-white/80"
                        : "bg-stone-100 text-stone-500",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search templates"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-9 rounded-lg border border-stone-200 bg-white text-sm placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center"
                  aria-label="Clear"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Premium callout for the workspace templates tab */}
          {tab === "workspace" && (
            <div className="mt-6 relative rounded-2xl overflow-hidden border border-amber-200 bg-white shadow-sm">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none"
              />
              <div
                aria-hidden
                className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-amber-100 opacity-50 blur-3xl pointer-events-none"
              />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                <span
                  aria-hidden
                  className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-amber-700 font-semibold">
                    Heads up
                  </p>
                  <p className="text-[14px] font-semibold text-stone-900 mt-1 leading-snug">
                    Browse here, apply at creation
                  </p>
                  <p className="text-[12.5px] text-stone-600 mt-1 leading-relaxed">
                    Workspace templates seed a brand-new workspace with folders, starter
                    docs, task columns, and settings. To use one, start a fresh workspace.
                  </p>
                </div>
                <Link
                  to="/workspaces/new"
                  className="h-9 px-3.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
                >
                  Create a workspace
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Body */}
          <section className="mt-6">
            {loading ? (
              <CardGridSkeleton />
            ) : tab === "workspace" ? (
              wsFiltered.length === 0 ? (
                <EmptyState query={query} kind="workspace templates" />
              ) : (
                <WorkspaceTemplateGrid
                  templates={wsFiltered}
                  onPreview={(t) => setPreviewWs(t)}
                />
              )
            ) : docFiltered.length === 0 ? (
              <EmptyState query={query} kind="document templates" />
            ) : (
              <DocumentTemplateList
                templates={docFiltered}
                onPreview={(t) => setPreviewDoc(t)}
                workspaceId={workspaceId}
                onUse={(t) => navigate(`/w/${workspaceId}/documents/new?template=${t.id}`)}
              />
            )}
          </section>
        </main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />

      <WorkspaceTemplatePreview
        template={previewWs}
        onClose={() => setPreviewWs(null)}
      />
      <DocumentTemplatePreview
        template={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onUse={(t) => {
          setPreviewDoc(null);
          navigate(`/w/${workspaceId}/documents/new?template=${t.id}`);
        }}
      />
    </div>
  );
};

export default Templates;

/* ─────────── Workspace template grid (editorial cards) ─────────── */

const CATEGORY_BADGE: Record<WorkspaceTemplate["category"], { label: string; cls: string; Icon: any }> = {
  professional: {
    label: "Professional",
    cls: "bg-teal-50 text-teal-700 border-teal-200",
    Icon: Briefcase,
  },
  academic: {
    label: "Academic",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: GraduationCap,
  },
  general: {
    label: "General",
    cls: "bg-stone-100 text-stone-600 border-stone-200",
    Icon: Layout,
  },
};

const WorkspaceTemplateGrid = ({
  templates,
  onPreview,
}: {
  templates: WorkspaceTemplate[];
  onPreview: (t: WorkspaceTemplate) => void;
}) => {
  // Group by category for editorial weight
  const groups: { key: WorkspaceTemplate["category"]; label: string; items: WorkspaceTemplate[] }[] = [
    { key: "professional", label: "Professional", items: templates.filter((t) => t.category === "professional") },
    { key: "academic", label: "Academic", items: templates.filter((t) => t.category === "academic") },
    { key: "general", label: "General", items: templates.filter((t) => t.category === "general") },
  ];

  return (
    <div className="space-y-12">
      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <div key={g.key}>
              <div className="flex items-center gap-3 mb-5">
                <h3 className="font-mono text-[10px] text-stone-500 tracking-[0.22em] uppercase">
                  {g.label}
                </h3>
                <div className="h-px flex-1 bg-stone-100" />
                <span className="font-mono text-[10px] text-stone-400 tabular-nums">
                  {g.items.length.toString().padStart(2, "0")}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {g.items.slice(0, 6).map((t) => {
                  const cat = CATEGORY_BADGE[t.category];
                  return (
                    <article
                      key={t.id}
                      className="group rounded-xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-md transition-all duration-150 flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="h-9 w-9 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center flex-shrink-0">
                          <cat.Icon className="h-4 w-4 text-stone-600" />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border",
                            cat.cls,
                          )}
                        >
                          {cat.label}
                        </span>
                      </div>
                      <h4
                        className="text-[17px] font-semibold text-stone-900 tracking-tight mt-1"
                        style={{ fontFamily: "Georgia, 'Iowan Old Style', serif" }}
                      >
                        {t.name}
                      </h4>
                      <p className="text-[12.5px] text-stone-500 mt-1 italic">
                        {t.tagline}
                      </p>
                      <p className="text-[13px] text-stone-700 leading-relaxed mt-3 line-clamp-3 flex-1">
                        {t.description}
                      </p>
                      <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-3 text-[11px] text-stone-500">
                        <span className="inline-flex items-center gap-1">
                          <FolderTree className="h-3 w-3" />
                          {t.preview.folders.length} folders
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {t.preview.documents.length} starter docs
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {t.preview.taskColumns.length} columns
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onPreview(t)}
                          className="h-8 px-3 rounded-md border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </button>
                        <Link
                          to={`/workspaces/new?template=${t.id}`}
                          className="h-8 px-3 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 flex-1 justify-center"
                        >
                          Use template
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ),
      )}
    </div>
  );
};

/* ─────────── Document template list — premium card grid ─────────── */

const DOC_CAT_LABEL: Record<DocumentTemplate["category"], string> = {
  meeting: "Meeting",
  planning: "Planning",
  research: "Research",
  writing: "Writing",
  engineering: "Engineering",
};

const DOC_CAT_TONE: Record<
  DocumentTemplate["category"],
  { chip: string; iconBg: string; iconColor: string; ring: string }
> = {
  meeting: {
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    iconBg: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-600",
    ring: "group-hover:border-sky-300",
  },
  planning: {
    chip: "bg-teal-50 text-teal-700 border-teal-200",
    iconBg: "bg-teal-50 border-teal-200",
    iconColor: "text-teal-600",
    ring: "group-hover:border-teal-300",
  },
  research: {
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    iconBg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    ring: "group-hover:border-amber-300",
  },
  writing: {
    chip: "bg-stone-100 text-stone-700 border-stone-200",
    iconBg: "bg-stone-50 border-stone-200",
    iconColor: "text-stone-600",
    ring: "group-hover:border-stone-300",
  },
  engineering: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
    ring: "group-hover:border-emerald-300",
  },
};

const DocumentTemplateList = ({
  templates,
  onPreview,
  onUse,
}: {
  templates: DocumentTemplate[];
  onPreview: (t: DocumentTemplate) => void;
  workspaceId: string;
  onUse: (t: DocumentTemplate) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {templates.map((t) => {
      const tone = DOC_CAT_TONE[t.category];
      const sectionCount = t.preview.sections.length;
      return (
        <article
          key={t.id}
          className={cn(
            "group relative rounded-xl border border-stone-200 bg-white p-5 hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden",
            tone.ring,
          )}
        >
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-lg border flex items-center justify-center flex-shrink-0",
                tone.iconBg,
              )}
            >
              <FileText className={cn("h-4 w-4", tone.iconColor)} />
            </div>
            <span
              className={cn(
                "text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border",
                tone.chip,
              )}
            >
              {DOC_CAT_LABEL[t.category]}
            </span>
          </div>

          <h4 className="text-[15px] font-semibold text-stone-900 tracking-tight mt-4 leading-snug">
            {t.name}
          </h4>
          <p className="text-[13px] text-stone-600 mt-1.5 leading-relaxed line-clamp-2 flex-1">
            {t.description}
          </p>

          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-3 text-[11px] text-stone-500">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {sectionCount} section{sectionCount === 1 ? "" : "s"}
            </span>
            {t.estReadMin > 0 && (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                ~{t.estReadMin} min
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPreview(t)}
              className="h-8 px-3 rounded-md border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors inline-flex items-center gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => onUse(t)}
              className="h-8 px-3 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 flex-1 justify-center"
            >
              Use template
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </article>
      );
    })}
  </div>
);

/* ─────────── States ─────────── */

const CardGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="h-9 w-9 rounded-lg bg-stone-100 animate-pulse" />
        <div className="h-5 w-3/5 rounded bg-stone-100 animate-pulse mt-4" />
        <div className="h-3 w-2/5 rounded bg-stone-100 animate-pulse mt-2" />
        <div className="h-3 w-full rounded bg-stone-100 animate-pulse mt-4" />
        <div className="h-3 w-4/5 rounded bg-stone-100 animate-pulse mt-2" />
        <div className="h-8 w-full rounded bg-stone-100 animate-pulse mt-6" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ query, kind }: { query: string; kind: string }) => (
  <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center relative overflow-hidden">
    <div
      aria-hidden
      className="absolute inset-0 bg-gradient-to-b from-stone-50/50 to-transparent pointer-events-none"
    />
    <div className="relative">
      <div className="h-12 w-12 rounded-xl bg-stone-100 border border-stone-200 mx-auto flex items-center justify-center mb-4">
        <Search className="h-5 w-5 text-stone-400" />
      </div>
      <p className="text-[15px] font-semibold text-stone-900">
        {query ? `No ${kind} match "${query}"` : `No ${kind} yet`}
      </p>
      <p className="text-[13px] text-stone-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
        {query
          ? "Try a shorter search or clear filters to see everything available."
          : "New templates show up here as they ship."}
      </p>
    </div>
  </div>
);

/* ─────────── Preview dialogs ─────────── */

const WorkspaceTemplatePreview = ({
  template,
  onClose,
}: {
  template: WorkspaceTemplate | null;
  onClose: () => void;
}) => {
  const open = !!template;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {template && (
          <>
            <DialogHeader>
              <span className="font-mono text-[10px] text-stone-400 tracking-[0.22em] uppercase">
                Workspace template
              </span>
              <DialogTitle
                className="text-2xl"
                style={{ fontFamily: "Georgia, 'Iowan Old Style', serif" }}
              >
                {template.name}
              </DialogTitle>
              <DialogDescription>{template.description}</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              <PreviewBlock title="Folders created" icon={FolderTree}>
                {template.preview.folders.length === 0 ? (
                  <EmptyLine label="No folders — clean slate" />
                ) : (
                  <ul className="text-[13px] text-stone-700 space-y-1">
                    {template.preview.folders.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-stone-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </PreviewBlock>

              <PreviewBlock title="Starter documents" icon={FileText}>
                {template.preview.documents.length === 0 ? (
                  <EmptyLine label="No starter docs" />
                ) : (
                  <ul className="text-[13px] text-stone-700 space-y-1">
                    {template.preview.documents.map((d) => (
                      <li key={d.title}>
                        <span>{d.title}</span>
                        <span className="text-stone-400"> · {d.folder}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </PreviewBlock>

              <PreviewBlock title="Task board columns" icon={Layers}>
                <div className="flex flex-wrap gap-1.5">
                  {template.preview.taskColumns.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] font-mono tracking-wider uppercase px-2 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </PreviewBlock>

              <PreviewBlock title="Settings" icon={SettingsIcon}>
                <ul className="text-[13px] text-stone-700 space-y-1.5">
                  <li className="flex items-center gap-2">
                    {template.preview.settings.submissionWorkflowEnabled ? (
                      <Check className="h-3.5 w-3.5 text-teal-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-stone-400" />
                    )}
                    Submission workflow
                  </li>
                  {"supervisorReviewEnabled" in template.preview.settings && (
                    <li className="flex items-center gap-2">
                      {template.preview.settings.supervisorReviewEnabled ? (
                        <Check className="h-3.5 w-3.5 text-teal-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-stone-400" />
                      )}
                      Supervisor review
                    </li>
                  )}
                  <li className="text-stone-500">
                    Default role label:{" "}
                    <span className="font-mono text-[11px] tracking-wider uppercase text-stone-700">
                      {template.preview.settings.roleLabel}
                    </span>
                  </li>
                </ul>
              </PreviewBlock>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-stone-500">
                Workspace templates apply only at creation.
              </p>
              <Link
                to={`/workspaces/new?template=${template.id}`}
                onClick={onClose}
                className="h-9 px-4 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-[13px] font-medium transition-colors inline-flex items-center gap-2"
              >
                Create a workspace with this template
              </Link>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const DocumentTemplatePreview = ({
  template,
  onClose,
  onUse,
}: {
  template: DocumentTemplate | null;
  onClose: () => void;
  onUse: (t: DocumentTemplate) => void;
}) => {
  const open = !!template;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        {template && (
          <>
            <DialogHeader>
              <span className="font-mono text-[10px] text-stone-400 tracking-[0.22em] uppercase">
                Document template
              </span>
              <DialogTitle className="text-xl">{template.name}</DialogTitle>
              <DialogDescription>{template.description}</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-4">
              <div className="font-mono text-[10px] text-stone-500 tracking-[0.18em] uppercase mb-2">
                Section outline
              </div>
              <ol className="text-[13px] text-stone-800 space-y-1.5 list-decimal list-inside">
                {template.preview.sections.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3 rounded-md border border-stone-200 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onUse(template)}
                className="h-9 px-4 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-[13px] font-medium inline-flex items-center gap-2"
              >
                Use this template
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PreviewBlock = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-stone-200 bg-stone-50/40 p-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-stone-500" />
      <span className="font-mono text-[10px] text-stone-500 tracking-[0.18em] uppercase">
        {title}
      </span>
    </div>
    {children}
  </div>
);

const EmptyLine = ({ label }: { label: string }) => (
  <p className="text-[12px] text-stone-400 italic">{label}</p>
);
