import { Link } from "react-router-dom";
import { FilePlus, FolderPlus, ArrowLeft, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/features/documents/components/document-tree";
import { useDocumentTreeState } from "@/features/documents/hooks/use-document-tree-state";
import { TreePanelNodeRow } from "./document-tree-node";

interface DocumentTreePanelProps {
  workspaceId: string;
  workspaceName: string;
  tree: TreeNode[];
  activeDocumentId: string | null;
  canCreate: boolean;
  onNewDoc?: () => void;
  onNewFolder?: () => void;
  onNavigate?: () => void;
  className?: string;
}

export const DocumentTreePanel = ({
  workspaceId,
  workspaceName,
  tree,
  activeDocumentId,
  canCreate,
  onNewDoc,
  onNewFolder,
  onNavigate,
  className,
}: DocumentTreePanelProps) => {
  const { expanded, toggle } = useDocumentTreeState({ tree, activeDocumentId });

  return (
    <aside
      aria-label="Workspace documents"
      className={cn(
        "flex flex-col h-full bg-stone-50/60 border-r border-stone-200 min-w-0",
        className,
      )}
    >
      {/* Tree header */}
      <div className="h-12 flex items-center justify-between gap-2 px-3 border-b border-stone-200 bg-stone-50/80 flex-shrink-0">
        <div className="min-w-0 flex items-center gap-2">
          <Link
            to={`/w/${workspaceId}/documents`}
            className="h-6 w-6 -ml-1 rounded flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Back to all documents"
            title="All documents"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-stone-900 tracking-tight leading-none truncate">
              Documents
            </h2>
            <p className="font-mono text-[9px] text-stone-400 tracking-[0.12em] uppercase mt-1 truncate">
              {workspaceName}
            </p>
          </div>
        </div>
        {canCreate && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={onNewFolder}
              className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="New folder"
              title="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onNewDoc}
              className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
              aria-label="New document"
              title="New document"
            >
              <FilePlus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tree body */}
      <nav
        aria-label="Document tree"
        className="flex-1 overflow-y-auto py-1.5"
      >
        {tree.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="h-9 w-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center mx-auto">
              <FileText className="h-4 w-4 text-stone-400" aria-hidden="true" />
            </div>
            <h3 className="text-[13px] font-semibold text-stone-900 mt-3">
              {canCreate ? "No documents yet" : "No documents"}
            </h3>
            <p className="text-[12px] text-stone-500 mt-1">
              {canCreate
                ? "Create your first document to get started."
                : "Nothing has been created here yet."}
            </p>
            {canCreate && (
              <div className="flex flex-col items-stretch gap-1.5 mt-4">
                <button
                  type="button"
                  onClick={onNewDoc}
                  className="h-8 px-3 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <FilePlus className="h-3.5 w-3.5" />
                  New document
                </button>
                <button
                  type="button"
                  onClick={onNewFolder}
                  className="h-8 px-3 rounded-md border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  New folder
                </button>
              </div>
            )}
          </div>
        ) : (
          <div role="tree" aria-label="Workspace document hierarchy">
            {tree.map((node) => (
              <TreePanelNodeRow
                key={node.id}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                workspaceId={workspaceId}
                activeDocumentId={activeDocumentId}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-stone-200 px-3 py-2 flex items-center justify-between bg-stone-50/80 flex-shrink-0">
        <Link
          to={`/w/${workspaceId}/documents`}
          className="font-mono text-[10px] tracking-wider uppercase text-stone-400 hover:text-stone-700 transition-colors"
        >
          All documents →
        </Link>
      </div>
    </aside>
  );
};
