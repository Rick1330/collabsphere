import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, History, FileX, Pencil, Shield } from "lucide-react";
import { toast } from "sonner";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import {
  WorkspaceSidebar,
  type WorkspaceForSidebar,
} from "@/features/workspace/components/workspace-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fullDateTime, relativeTime } from "@/lib/format";
import {
  REASON_META,
  getVersionHistory,
  type DocumentVersion,
} from "@/api/adapters/documents";
import { VersionTimeline } from "@/features/documents/components/history/version-timeline";
import { RestoreConfirmDialog } from "@/features/documents/components/history/restore-confirm-dialog";
import { resolveDocumentParam, resolveWorkspaceParam } from "@/lib/route-params";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };
const CURRENT_USER_ID = "user-jane";

type WorkspaceWithRole = WorkspaceForSidebar & {
  myRole: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
};

const WORKSPACES: Record<string, WorkspaceWithRole> = {
  alpha: {
    id: "alpha", name: "Project Alpha", description: "", icon: "📦",
    type: "professional", roleLabel: "TECH LEAD", status: "active", myRole: "ADMIN",
    permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: true },
  },
  thesis: {
    id: "thesis", name: "Thesis — Distributed Systems", description: "", icon: "🎓",
    type: "academic", roleLabel: "STUDENT", status: "active", myRole: "MEMBER",
    permissions: { canCreateContent: true, canEditSettings: false, canViewAnalytics: false },
  },
  personal: {
    id: "personal", name: "Personal Notes", description: "", icon: "📝",
    type: "general", roleLabel: "OWNER", status: "active", myRole: "OWNER",
    permissions: { canCreateContent: true, canEditSettings: true, canViewAnalytics: false },
  },
  research: {
    id: "research", name: "Research Group", description: "", icon: "🔬",
    type: "academic", roleLabel: "REVIEWER", status: "archived", myRole: "MEMBER",
    permissions: { canCreateContent: false, canEditSettings: true, canViewAnalytics: false },
  },
};

const DOC_TITLES: Record<string, string> = {
  "d-roadmap": "Project Roadmap Q4",
  "d-prd": "PRD v2",
  "d-api": "API Design",
  "d-adr": "ADR-003 Prisma",
};

const PAGE_SIZE = 10;

const DocumentHistoryPage = () => {
  const params = useParams();
  const workspaceId = resolveWorkspaceParam(params.workspaceId);
  const documentId = resolveDocumentParam(params.documentId);
  const navigate = useNavigate();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();

  const workspace = WORKSPACES[workspaceId] ?? {
    ...WORKSPACES.alpha,
    id: workspaceId,
  };
  const docTitle = DOC_TITLES[documentId] ?? "Untitled document";

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  useEffect(() => {
    setIsLoading(true);
    const t = window.setTimeout(() => {
      setVersions(getVersionHistory(documentId));
      setIsLoading(false);
    }, 280);
    return () => window.clearTimeout(t);
  }, [documentId]);

  useEffect(() => {
    document.title = `History — ${docTitle} — CollabSphere`;
  }, [docTitle]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [restoreOpen, setRestoreOpen] = useState(false);

  useEffect(() => {
    if (versions.length > 0 && !selectedId) setSelectedId(versions[0].id);
  }, [versions, selectedId]);

  const totalPages = Math.max(1, Math.ceil(versions.length / PAGE_SIZE));
  const pageVersions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return versions.slice(start, start + PAGE_SIZE);
  }, [versions, page]);

  const selected = useMemo(
    () => versions.find((v) => v.id === selectedId) ?? null,
    [versions, selectedId],
  );
  const currentVersionId = versions[0]?.id ?? null;

  // Permissions: only OWNER/ADMIN/MANAGER can restore. Cannot restore in archived workspace.
  const canRestore =
    workspace.status === "active" &&
    (workspace.myRole === "OWNER" ||
      workspace.myRole === "ADMIN" ||
      workspace.myRole === "MANAGER");

  const handleConfirmRestore = () => {
    if (!selected) return;
    setRestoreOpen(false);
    toast.success(`Restored version #${selected.versionNumber}`, {
      description: "A safety snapshot of the previous state was saved first.",
    });
    // Optimistically synthesize a "before_restore" + new "manual" head
    const safety: DocumentVersion = {
      id: `ver-safety-${Date.now()}`,
      documentId,
      versionNumber: (versions[0]?.versionNumber ?? 0) + 1,
      reason: "before_restore",
      createdAt: new Date().toISOString(),
      createdById: CURRENT_USER_ID,
      createdByName: MOCK_USER.fullName,
      contentExcerpt: "Safety snapshot captured automatically before restore.",
      note: `Auto-saved before restoring v${selected.versionNumber}.`,
      charCount: versions[0]?.charCount ?? 0,
    };
    const restored: DocumentVersion = {
      ...selected,
      id: `ver-restore-${Date.now()}`,
      versionNumber: safety.versionNumber + 1,
      reason: "manual",
      createdAt: new Date(Date.now() + 1).toISOString(),
      createdById: CURRENT_USER_ID,
      createdByName: MOCK_USER.fullName,
      note: `Restored from version #${selected.versionNumber}.`,
    };
    setVersions((prev) => [restored, ...[safety, ...prev]]);
    setSelectedId(restored.id);
    setPage(1);
  };

  return (
    <div className="app-light min-h-screen flex bg-stone-50">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="flex-1 min-h-0 overflow-y-auto">
          {/* Editorial archival header */}
          <div className="border-b border-stone-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 pb-6">
              <Link
                to={`/w/${workspaceId}/documents/${documentId}`}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-stone-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to document
              </Link>
              <div className="flex items-end justify-between gap-6 mt-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-stone-400">
                    Version history
                  </p>
                  <h1 className="text-[28px] sm:text-[32px] leading-tight font-bold text-stone-900 tracking-tight mt-1">
                    {docTitle}
                  </h1>
                  <p className="text-[13px] text-stone-500 mt-2 max-w-2xl leading-relaxed">
                    Every save, submission, and supervisor decision is captured as a
                    version. Older versions are read-only and can be restored —
                    we always snapshot the current state first.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-stone-500">
                  <Stat label="Versions" value={versions.length} />
                  <span className="h-6 w-px bg-stone-200" />
                  <Stat
                    label="Latest"
                    value={
                      versions[0]
                        ? relativeTime(versions[0].createdAt)
                        : "—"
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            {isLoading && <HistorySkeleton />}

            {!isLoading && versions.length === 0 && (
              <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
                <div className="h-12 w-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
                  <History className="h-6 w-6 text-stone-400" />
                </div>
                <h2 className="text-base font-semibold text-stone-900 mt-4">
                  No version history yet
                </h2>
                <p className="text-sm text-stone-500 mt-1.5 max-w-sm mx-auto">
                  This document hasn't been saved enough times to have a
                  recorded history. Save manually with ⌘S to capture a version.
                </p>
              </div>
            )}

            {!isLoading && versions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-8">
                {/* Timeline */}
                <section aria-label="Version timeline">
                  <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-3 px-3">
                    Timeline · page {page} of {totalPages}
                  </h2>
                  <VersionTimeline
                    versions={pageVersions}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    canRestore={canRestore}
                    onRestore={() => setRestoreOpen(true)}
                    currentVersionId={currentVersionId}
                  />
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between gap-3 px-3">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="h-8 px-3 rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ← Newer
                      </button>
                      <span className="font-mono text-[11px] text-stone-400 tabular-nums">
                        {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="h-8 px-3 rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Older →
                      </button>
                    </div>
                  )}
                </section>

                {/* Detail rail */}
                <aside aria-label="Selected version preview" className="lg:sticky lg:top-4 self-start">
                  {selected ? (
                    <VersionDetail
                      version={selected}
                      isCurrent={selected.id === currentVersionId}
                      canRestore={canRestore}
                      onRestore={() => setRestoreOpen(true)}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center text-[13px] text-stone-400">
                      Select a version to preview.
                    </div>
                  )}
                  {!canRestore && (
                    <p className="mt-3 text-[11px] text-stone-400 italic px-1 leading-relaxed">
                      Only Owners, Admins, and Managers can restore prior
                      versions{workspace.status === "archived" ? " — and not while the workspace is archived" : ""}.
                    </p>
                  )}
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />

      <RestoreConfirmDialog
        open={restoreOpen}
        version={selected}
        onCancel={() => setRestoreOpen(false)}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="text-right">
    <div className="font-mono text-[9px] tracking-wider uppercase text-stone-400">{label}</div>
    <div className="text-[13px] font-semibold text-stone-700 tabular-nums">{value}</div>
  </div>
);

const HistorySkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-8">
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-80 rounded-2xl" />
  </div>
);

const VersionDetail = ({
  version,
  isCurrent,
  canRestore,
  onRestore,
}: {
  version: DocumentVersion;
  isCurrent: boolean;
  canRestore: boolean;
  onRestore: () => void;
}) => {
  const meta = REASON_META[version.reason];
  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <header className="px-5 py-4 border-b border-stone-200 bg-stone-50/40">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border",
              meta.tone === "amber" && "bg-amber-50 text-amber-700 border-amber-200",
              meta.tone === "emerald" && "bg-emerald-50 text-emerald-700 border-emerald-200",
              meta.tone === "blue" && "bg-sky-50 text-sky-700 border-sky-200",
              meta.tone === "neutral" && "bg-stone-50 text-stone-600 border-stone-200",
              meta.tone === "stone" && "bg-stone-100 text-stone-700 border-stone-300",
            )}
          >
            {meta.label}
          </span>
          {version.versionLabel && (
            <span className="font-mono text-[10px] tracking-wider uppercase text-stone-500 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
              {version.versionLabel}
            </span>
          )}
          {isCurrent && (
            <span className="font-mono text-[10px] tracking-wider uppercase text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              Current
            </span>
          )}
          <span className="ml-auto font-mono text-[11px] text-stone-400 tabular-nums">
            #{version.versionNumber}
          </span>
        </div>
        <h3 className="text-[15px] font-semibold text-stone-900 mt-2">
          {version.createdByName} · <span className="text-stone-500 font-normal">{relativeTime(version.createdAt)}</span>
        </h3>
        <p className="text-[11px] text-stone-400 font-mono mt-0.5" title={fullDateTime(version.createdAt)}>
          {fullDateTime(version.createdAt)}
        </p>
        <p className="text-[11.5px] text-stone-500 mt-2 leading-relaxed">{meta.description}</p>
      </header>

      <div className="p-5 space-y-4">
        {version.note && (
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">
              Author note
            </p>
            <p className="text-[13px] text-stone-700 italic leading-relaxed border-l-2 border-stone-200 pl-3">
              "{version.note}"
            </p>
          </div>
        )}

        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">
            Plaintext preview
          </p>
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 max-h-72 overflow-y-auto">
            <p className="text-[12.5px] text-stone-700 leading-relaxed whitespace-pre-wrap font-serif">
              {version.contentExcerpt}
            </p>
          </div>
          <p className="text-[10px] text-stone-400 font-mono mt-1.5 tabular-nums">
            {version.charCount.toLocaleString()} chars total
          </p>
        </div>

        {canRestore && !isCurrent && (
          <button
            type="button"
            onClick={onRestore}
            className="w-full h-9 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Shield className="h-3.5 w-3.5" />
            Restore this version
          </button>
        )}
        {isCurrent && (
          <p className="text-center text-[11.5px] text-stone-400 italic flex items-center justify-center gap-1.5">
            <Pencil className="h-3 w-3" />
            This is the current document.
          </p>
        )}
      </div>
    </div>
  );
};

export default DocumentHistoryPage;
