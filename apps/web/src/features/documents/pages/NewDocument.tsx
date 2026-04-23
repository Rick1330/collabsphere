import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  FolderTree,
  Loader2,
  Sparkles,
} from "lucide-react";
import { TopNav } from "@/app/shell/top-nav";
import { CommandPalette } from "@/app/shell/command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { DOCUMENT_TEMPLATES, getDocumentTemplate } from "@/api/adapters/templates";
import { buildDocumentSeed, stashPendingDoc } from "@/api/adapters/templates";
import { useDocumentTree } from "@/features/documents/hooks/use-document-tree";
import type { TreeNode } from "@/features/documents/components/document-tree";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_USER = { fullName: "Elshaday Tesfaye", email: "jane@collabsphere.app" };

interface FolderOpt {
  id: string;
  label: string;
  depth: number;
}

function flattenFolders(nodes: TreeNode[], depth = 0, parentPath = ""): FolderOpt[] {
  const out: FolderOpt[] = [];
  for (const n of nodes) {
    if (n.type === "folder") {
      const label = parentPath ? `${parentPath} / ${n.name}` : n.name;
      out.push({ id: n.id, label, depth });
      out.push(...flattenFolders(n.children, depth + 1, label));
    }
  }
  return out;
}

const NewDocument = () => {
  const { workspaceId = "alpha" } = useParams<{ workspaceId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const palette = useCommandPalette();

  const [title, setTitle] = useState(params.get("title") ?? "");
  const [folder, setFolder] = useState<string>(params.get("folder") ?? "__root__");
  const [templateId, setTemplateId] = useState<string>(params.get("template") ?? "doc-blank");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tree } = useDocumentTree(workspaceId);
  const folders = useMemo(() => flattenFolders(tree), [tree]);
  const template = getDocumentTemplate(templateId) ?? DOCUMENT_TEMPLATES[0];

  useEffect(() => {
    document.title = "New document — CollabSphere";
  }, []);

  const handleCreate = async () => {
    setError(null);
    if (title.trim().length < 2) {
      setError("Give the document a title (2 characters minimum).");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    // Resolve the destination folder label (so the editor breadcrumb is right).
    const folderLabel =
      folder === "__root__"
        ? null
        : folders.find((f) => f.id === folder)?.label ?? null;

    // Seed content from the chosen document template, stash it under a fresh
    // doc id, then open the editor — which will pick the seed up on mount.
    const newId = `doc-${Date.now().toString(36)}`;
    const seed = buildDocumentSeed(title, templateId, folderLabel);
    stashPendingDoc(newId, seed);

    setSubmitting(false);
    toast.success(`"${seed.title}" created`, {
      description:
        seed.templateId === "doc-blank"
          ? "Opening the editor."
          : `Seeded from ${seed.templateName}.`,
    });
    navigate(`/w/${workspaceId}/documents/${newId}`);
  };

  return (
    <div className="app-light min-h-screen flex flex-col">
      <TopNav user={MOCK_USER} unreadCount={3} onOpenPalette={palette.toggle} />

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-[920px] px-6 sm:px-8 pt-10 pb-24">
          {/* Top row */}
          <div className="flex items-center justify-between mb-10">
            <Link
              to={`/w/${workspaceId}/documents`}
              className="inline-flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Documents
            </Link>
            <span className="font-mono text-[10px] text-stone-400 tracking-[0.22em] uppercase">
              New Document
            </span>
          </div>

          {/* Editorial header */}
          <header className="mb-10">
            <span className="font-mono text-[10px] text-stone-400 tracking-[0.22em] uppercase block mb-3">
              Compose
            </span>
            <h1
              className="text-[34px] sm:text-[38px] leading-[1.05] tracking-[-0.025em] text-stone-900"
              style={{ fontFamily: "Georgia, 'Iowan Old Style', serif" }}
            >
              Start a new document
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-stone-500 max-w-[52ch]">
              Give it a name, choose where it lives, and pick a template. You can change everything once you're inside.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            {/* LEFT — form */}
            <div className="space-y-10">
              {/* Title */}
              <div className="space-y-1.5">
                <label
                  htmlFor="doc-title"
                  className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase block"
                >
                  Title
                </label>
                <input
                  id="doc-title"
                  type="text"
                  placeholder="Untitled"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={140}
                  autoFocus
                  className="w-full bg-transparent border-0 border-b border-stone-200 px-0 py-3
                    text-[26px] tracking-[-0.015em] text-stone-900 placeholder:text-stone-300
                    focus:border-stone-900 focus:outline-none focus:ring-0 transition-colors"
                  style={{ fontFamily: "Georgia, 'Iowan Old Style', serif" }}
                />
                <div className="text-right">
                  <span className="font-mono text-[10px] text-stone-300 tabular-nums">
                    {title.length}/140
                  </span>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <label
                  htmlFor="doc-folder"
                  className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase block"
                >
                  Destination
                </label>
                <div className="relative">
                  <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  <select
                    id="doc-folder"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    className="w-full h-11 pl-9 pr-9 rounded-lg border border-stone-200 bg-white text-[14px] text-stone-900 appearance-none focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200/50"
                  >
                    <option value="__root__">Root (no folder)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {"  ".repeat(f.depth)}
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Template */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase block">
                    Template
                  </label>
                  <Link
                    to={`/w/${workspaceId}/templates`}
                    className="text-[11.5px] text-teal-700 hover:text-teal-800 font-medium"
                  >
                    Browse all →
                  </Link>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DOCUMENT_TEMPLATES.slice(0, 6).map((t) => {
                    const active = t.id === templateId;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => setTemplateId(t.id)}
                          className={cn(
                            "w-full text-left rounded-lg border p-3.5 transition-all",
                            active
                              ? "border-stone-900 bg-stone-50/60 shadow-sm"
                              : "border-stone-200 bg-white hover:border-stone-300",
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                "h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 border",
                                active
                                  ? "bg-stone-900 border-stone-900 text-white"
                                  : "bg-stone-50 border-stone-200 text-stone-500",
                              )}
                            >
                              {active ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <FileText className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-stone-900 truncate">
                                {t.name}
                              </div>
                              <p className="text-[11.5px] text-stone-500 line-clamp-2 mt-0.5">
                                {t.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {error && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-800 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  {error}
                </div>
              )}

              {/* CTA */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Link
                  to={`/w/${workspaceId}/documents`}
                  className="h-10 px-4 rounded-lg text-[13px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors inline-flex items-center"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={submitting || title.trim().length < 2}
                  className="h-10 px-5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[13px] font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      Create document
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT — template preview */}
            <aside className="lg:border-l lg:border-stone-100 lg:pl-8">
              <div className="font-mono text-[10px] text-stone-500 tracking-[0.22em] uppercase mb-3">
                Preview
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5 min-h-[260px]">
                <h3 className="text-[15px] font-semibold text-stone-900">{template.name}</h3>
                <p className="text-[12.5px] text-stone-500 mt-1">{template.description}</p>
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="font-mono text-[10px] text-stone-400 tracking-[0.18em] uppercase mb-2">
                    Section outline
                  </div>
                  <ol className="text-[12.5px] text-stone-800 space-y-1.5 list-decimal list-inside">
                    {template.preview.sections.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
                {template.estReadMin > 0 && (
                  <p className="text-[11px] font-mono text-stone-400 mt-4 tabular-nums">
                    ~{template.estReadMin} min reading scaffold
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
};

export default NewDocument;
