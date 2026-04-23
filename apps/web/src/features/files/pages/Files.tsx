import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Archive,
  ChevronDown,
  Copy as CopyIcon,
  Download,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Filter,
  FolderOpen,
  Grid3X3,
  Image as ImageIcon,
  Layers,
  List as ListIcon,
  MoreHorizontal,
  Plug,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { WorkspaceSidebar, type WorkspaceForSidebar } from "@/features/workspace/components/workspace-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useStoredWorkspaces } from "@/features/workspace/store/workspace-store";
import { PageHeader, MetaStat, MetaDivider } from "@/components/shared/page-header";
import { MOCK_FILES, formatBytes, type FileItem, type FileKind } from "@/api/adapters/files";
import { relativeTime, getInitials, getAvatarColor, fullDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };
const PAGE_SIZE = 25;

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

const KIND_META: Record<FileKind, { label: string; Icon: any; color: string }> = {
  pdf:     { label: "PDF",     Icon: FileText,        color: "text-red-600 bg-red-50 border-red-200" },
  image:   { label: "Image",   Icon: FileImage,       color: "text-purple-600 bg-purple-50 border-purple-200" },
  doc:     { label: "Doc",     Icon: FileText,        color: "text-sky-600 bg-sky-50 border-sky-200" },
  sheet:   { label: "Sheet",   Icon: FileSpreadsheet, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  slides:  { label: "Slides",  Icon: Layers,          color: "text-amber-600 bg-amber-50 border-amber-200" },
  video:   { label: "Video",   Icon: FileVideo,       color: "text-rose-600 bg-rose-50 border-rose-200" },
  audio:   { label: "Audio",   Icon: FileAudio,       color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  archive: { label: "Archive", Icon: FileArchive,     color: "text-stone-700 bg-stone-100 border-stone-200" },
  other:   { label: "File",    Icon: FileIcon,        color: "text-stone-500 bg-stone-50 border-stone-200" },
};

const Files = () => {
  const { workspaceId = "alpha" } = useParams<{ workspaceId: string }>();
  const { collapsed, toggle } = useSidebar();
  const palette = useCommandPalette();
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

  const isArchived = workspace.status === "archived";
  const canUpload = workspace.permissions.canCreateContent && !isArchived;

  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<FileKind | "all">("all");
  const [uploaderFilter, setUploaderFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    document.title = `Files — ${workspace.name} — CollabSphere`;
  }, [workspace.name]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const uploaders = useMemo(() => {
    const map = new Map<string, string>();
    MOCK_FILES.forEach((f) => map.set(f.uploadedBy.id, f.uploadedBy.fullName));
    return Array.from(map.entries());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_FILES.filter((f) => {
      if (kindFilter !== "all" && f.kind !== kindFilter) return false;
      if (uploaderFilter !== "all" && f.uploadedBy.id !== uploaderFilter) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, kindFilter, uploaderFilter]);
  const hasSeedFiles = MOCK_FILES.length > 0;
  const isEmptyResult = filtered.length === 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleUpload = () => setShowUpload(true);

  const handleAction = (action: "download" | "copy" | "delete", file: FileItem) => {
    if (action === "copy") {
      navigator.clipboard?.writeText(`https://collabsphere.app/files/${file.id}`).catch(() => {});
      toast.success("Link copied");
      return;
    }
    if (action === "download") {
      toast.message("Download not connected", {
        description: "File storage isn't wired in this build. The action is a placeholder.",
      });
      return;
    }
    if (action === "delete") {
      toast.message("Delete not connected", {
        description: "Destructive actions are disabled until storage is wired.",
      });
      return;
    }
  };

  return (
    <div className="app-light min-h-screen flex">
      <WorkspaceSidebar workspace={workspace} collapsed={collapsed} onToggle={toggle} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

        <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto w-full">
          <PageHeader
            variant="contextual"
            eyebrow="Library"
            title="Files"
            description="Shared assets uploaded into this workspace. Filter, search, and manage attachments."
            icon={<FolderOpen className="h-5 w-5 text-stone-700" />}
            actions={
              canUpload ? (
                <button
                  type="button"
                  onClick={handleUpload}
                  className="h-9 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
              ) : isArchived ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                  <Archive className="h-3.5 w-3.5" />
                  Archived — read only
                </span>
              ) : undefined
            }
            meta={
              <>
                <MetaStat icon={FolderOpen} value={MOCK_FILES.length} label="files" />
                <MetaDivider />
                <MetaStat
                  value={formatBytes(MOCK_FILES.reduce((a, f) => a + f.sizeBytes, 0))}
                  label="total"
                />
              </>
            }
          />

          {/* Toolbar */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by filename"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 pl-9 pr-9 rounded-lg border border-stone-200 bg-white text-sm placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200/50"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center"
                    aria-label="Clear"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <FilterSelect
                label="Type"
                value={kindFilter}
                onChange={(v) => {
                  setKindFilter(v as any);
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "All types" },
                  ...Object.entries(KIND_META).map(([k, m]) => ({ value: k, label: m.label })),
                ]}
              />

              <FilterSelect
                label="Uploaded by"
                value={uploaderFilter}
                onChange={(v) => {
                  setUploaderFilter(v);
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "Anyone" },
                  ...uploaders.map(([id, name]) => ({ value: id, label: name })),
                ]}
              />
            </div>

            <div className="inline-flex items-center gap-1 p-0.5 rounded-md border border-stone-200 bg-white">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "h-7 w-7 rounded inline-flex items-center justify-center transition-colors",
                  view === "list" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100",
                )}
                aria-label="List view"
              >
                <ListIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "h-7 w-7 rounded inline-flex items-center justify-center transition-colors",
                  view === "grid" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100",
                )}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <section className="mt-5">
            {loading ? (
              <FilesSkeleton view={view} />
            ) : isEmptyResult ? (
              !hasSeedFiles ? (
                <EmptyState canUpload={canUpload} onUpload={handleUpload} />
              ) : (
                <NoMatch onClear={() => { setQuery(""); setKindFilter("all"); setUploaderFilter("all"); }} />
              )
            ) : view === "list" ? (
              <FilesTable files={visible} isArchived={isArchived} onAction={handleAction} />
            ) : (
              <FilesGrid files={visible} isArchived={isArchived} onAction={handleAction} />
            )}

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="mt-5 flex items-center justify-between text-[12px] text-stone-500">
                <span>
                  Showing{" "}
                  <span className="font-medium text-stone-900 tabular-nums">
                    {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
                  </span>{" "}
                  of <span className="tabular-nums">{filtered.length}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={safePage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2 rounded border border-stone-200 bg-white text-[12px] disabled:opacity-40 hover:bg-stone-50"
                  >
                    Prev
                  </button>
                  <span className="font-mono tabular-nums px-2">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    disabled={safePage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 px-2 rounded border border-stone-200 bg-white text-[12px] disabled:opacity-40 hover:bg-stone-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />

      <UploadDialog open={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
};

export default Files;

/* ─────────── Toolbar select ─────────── */
const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="relative">
    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-400 pointer-events-none" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-9 pl-7 pr-7 rounded-lg border border-stone-200 bg-white text-[12.5px] text-stone-700 appearance-none focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200/50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {label}: {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-400 pointer-events-none" />
  </div>
);

/* ─────────── Table view ─────────── */
const FilesTable = ({
  files,
  isArchived,
  onAction,
}: {
  files: FileItem[];
  isArchived: boolean;
  onAction: (a: "download" | "copy" | "delete", f: FileItem) => void;
}) => (
  <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-stone-50/60 border-b border-stone-100">
          <tr className="text-[10px] font-mono tracking-[0.18em] uppercase text-stone-500">
            <th className="text-left px-4 py-2.5 font-medium">Name</th>
            <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Type</th>
            <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">Size</th>
            <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">Uploaded by</th>
            <th className="text-left px-4 py-2.5 font-medium">When</th>
            <th className="px-4 py-2.5 w-[60px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {files.map((f) => {
            const meta = KIND_META[f.kind];
            const initials = getInitials(f.uploadedBy.fullName);
            const avatar = getAvatarColor(f.uploadedBy.fullName);
            return (
              <tr key={f.id} className="group hover:bg-stone-50/60 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-md border flex items-center justify-center flex-shrink-0",
                        meta.color,
                      )}
                    >
                      <meta.Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-stone-900 truncate">
                        {f.name}
                      </div>
                      {f.folder && (
                        <div className="text-[11px] text-stone-400 truncate">{f.folder}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-stone-500">
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-[12.5px] text-stone-600 tabular-nums">
                  {formatBytes(f.sizeBytes)}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="inline-flex items-center gap-2 text-[12.5px] text-stone-600">
                    <span
                      className="h-5 w-5 rounded-full text-[9px] font-semibold text-white inline-flex items-center justify-center"
                      style={{ backgroundColor: avatar }}
                    >
                      {initials}
                    </span>
                    {f.uploadedBy.fullName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <time
                    dateTime={f.uploadedAt}
                    title={fullDateTime(f.uploadedAt)}
                    className="font-mono text-[11px] text-stone-500 tabular-nums"
                  >
                    {relativeTime(f.uploadedAt)}
                  </time>
                </td>
                <td className="px-4 py-3 text-right">
                  <RowActions file={f} isArchived={isArchived} onAction={onAction} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

/* ─────────── Grid view ─────────── */
const FilesGrid = ({
  files,
  isArchived,
  onAction,
}: {
  files: FileItem[];
  isArchived: boolean;
  onAction: (a: "download" | "copy" | "delete", f: FileItem) => void;
}) => (
  <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
    {files.map((f) => {
      const meta = KIND_META[f.kind];
      return (
        <li
          key={f.id}
          className="group rounded-xl border border-stone-200 bg-white p-3 hover:border-stone-300 hover:shadow-sm transition-all"
        >
          <div
            className={cn(
              "aspect-[4/3] rounded-md border flex items-center justify-center mb-2.5",
              meta.color,
            )}
          >
            <meta.Icon className="h-7 w-7" />
          </div>
          <div className="text-[12.5px] font-medium text-stone-900 truncate" title={f.name}>
            {f.name}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10.5px] text-stone-500">
            <span className="font-mono tabular-nums">{formatBytes(f.sizeBytes)}</span>
            <time dateTime={f.uploadedAt}>{relativeTime(f.uploadedAt)}</time>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[10.5px] text-stone-500 truncate">
              {f.uploadedBy.fullName}
            </span>
            <RowActions file={f} isArchived={isArchived} onAction={onAction} compact />
          </div>
        </li>
      );
    })}
  </ul>
);

const RowActions = ({
  file,
  isArchived,
  onAction,
  compact,
}: {
  file: FileItem;
  isArchived: boolean;
  onAction: (a: "download" | "copy" | "delete", f: FileItem) => void;
  compact?: boolean;
}) => (
  <div className={cn("inline-flex items-center gap-1", !compact && "opacity-0 group-hover:opacity-100 transition-opacity")}>
    <button
      onClick={() => onAction("download", file)}
      title="Download"
      className="h-7 w-7 rounded-md hover:bg-stone-100 text-stone-500 hover:text-stone-900 inline-flex items-center justify-center"
    >
      <Download className="h-3.5 w-3.5" />
    </button>
    <button
      onClick={() => onAction("copy", file)}
      title="Copy link"
      className="h-7 w-7 rounded-md hover:bg-stone-100 text-stone-500 hover:text-stone-900 inline-flex items-center justify-center"
    >
      <CopyIcon className="h-3.5 w-3.5" />
    </button>
    {!isArchived && (
      <button
        onClick={() => onAction("delete", file)}
        title="Delete"
        className="h-7 w-7 rounded-md hover:bg-red-50 text-stone-500 hover:text-red-600 inline-flex items-center justify-center"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

/* ─────────── States ─────────── */
const FilesSkeleton = ({ view }: { view: "list" | "grid" }) =>
  view === "list" ? (
    <div className="rounded-xl border border-stone-200 bg-white p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 border-b border-stone-100 last:border-0">
          <div className="h-8 w-8 rounded-md bg-stone-100 animate-pulse" />
          <div className="flex-1">
            <div className="h-3 w-1/3 rounded bg-stone-100 animate-pulse" />
            <div className="h-2.5 w-1/4 rounded bg-stone-100 animate-pulse mt-2" />
          </div>
          <div className="h-3 w-16 rounded bg-stone-100 animate-pulse" />
        </div>
      ))}
    </div>
  ) : (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="aspect-[4/3] rounded-md bg-stone-100 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-stone-100 animate-pulse mt-2.5" />
          <div className="h-2.5 w-1/2 rounded bg-stone-100 animate-pulse mt-2" />
        </li>
      ))}
    </ul>
  );

const EmptyState = ({ canUpload, onUpload }: { canUpload: boolean; onUpload: () => void }) => (
  <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/40 p-12 text-center">
    <div className="h-12 w-12 rounded-xl bg-white border border-stone-200 mx-auto flex items-center justify-center mb-3 shadow-sm">
      <FolderOpen className="h-5 w-5 text-stone-400" />
    </div>
    <p className="text-base font-medium text-stone-900">No files yet</p>
    <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
      Drop files here to share assets with the workspace — designs, decks, contracts, recordings.
    </p>
    {canUpload && (
      <button
        type="button"
        onClick={onUpload}
        className="mt-5 h-9 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium inline-flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload your first file
      </button>
    )}
  </div>
);

const NoMatch = ({ onClear }: { onClear: () => void }) => (
  <div className="rounded-xl border border-stone-200 bg-white p-10 text-center">
    <Search className="h-5 w-5 text-stone-400 mx-auto mb-2" />
    <p className="text-sm font-medium text-stone-900">No files match your filters</p>
    <button
      type="button"
      onClick={onClear}
      className="text-[12.5px] text-teal-700 hover:text-teal-800 font-medium mt-2"
    >
      Clear filters
    </button>
  </div>
);

const UploadDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plug className="h-4 w-4 text-amber-600" />
          Upload not connected
        </DialogTitle>
        <DialogDescription>
          File storage isn't wired into this build yet. The files library shows the surface,
          actions, and states truthfully — but uploading, downloading, and deleting are
          intentionally inert until storage is connected.
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center">
        <Upload className="h-6 w-6 text-stone-400 mx-auto" />
        <p className="text-[12.5px] text-stone-500 mt-2">
          Drop files here when storage is connected.
        </p>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="h-9 px-3 rounded-md border border-stone-200 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
        >
          Got it
        </button>
      </div>
    </DialogContent>
  </Dialog>
);
