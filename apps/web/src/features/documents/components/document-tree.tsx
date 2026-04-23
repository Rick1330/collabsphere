import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Lock,
  FilePlus,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeTime, fullDateTime } from "@/lib/format";
import { toast } from "sonner";
import { TreeContextMenu } from "./tree-context-menu";
import { TreeCreateDialog } from "./tree-create-dialog";

type DocStatus = "draft" | "submitted" | "changes_requested" | "approved" | "archived";

export interface TreeDocumentNode {
  type: "document";
  id: string;
  title: string;
  status: DocStatus;
  isLocked?: boolean;
  lockedBy?: { fullName: string };
  updatedAt: string;
}

export interface TreeFolderNode {
  type: "folder";
  id: string;
  name: string;
  children: TreeNode[];
}

export type TreeNode = TreeFolderNode | TreeDocumentNode;

interface DocumentTreeProps {
  workspaceId: string;
  initialTree: TreeNode[];
  canCreate: boolean;
  autoOpen?: "doc" | "folder" | null;
  onAutoOpenHandled?: () => void;
}

const isRecentlyEdited = (updatedAt: string) =>
  Date.now() - new Date(updatedAt).getTime() < 60 * 60 * 1000;

const collectFolderIds = (nodes: TreeNode[], target: Set<string>) => {
  for (const node of nodes) {
    if (node.type === "folder") {
      target.add(node.id);
      collectFolderIds(node.children, target);
    }
  }
};

const countDocs = (nodes: TreeNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "document") count++;
    else count += countDocs(node.children);
  }
  return count;
};

// Mutate helpers (returns new tree)
const insertChild = (nodes: TreeNode[], parentId: string | null, child: TreeNode): TreeNode[] => {
  if (parentId === null) return [...nodes, child];
  return nodes.map((n) => {
    if (n.type === "folder" && n.id === parentId) {
      return { ...n, children: [...n.children, child] };
    }
    if (n.type === "folder") {
      return { ...n, children: insertChild(n.children, parentId, child) };
    }
    return n;
  });
};

const removeNode = (nodes: TreeNode[], id: string): TreeNode[] =>
  nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.type === "folder" ? { ...n, children: removeNode(n.children, id) } : n,
    );

const renameFolder = (nodes: TreeNode[], id: string, name: string): TreeNode[] =>
  nodes.map((n) => {
    if (n.type === "folder" && n.id === id) return { ...n, name };
    if (n.type === "folder") return { ...n, children: renameFolder(n.children, id, name) };
    return n;
  });

const findFolderEmpty = (nodes: TreeNode[], id: string): boolean | null => {
  for (const n of nodes) {
    if (n.type === "folder" && n.id === id) return n.children.length === 0;
    if (n.type === "folder") {
      const r = findFolderEmpty(n.children, id);
      if (r !== null) return r;
    }
  }
  return null;
};

export const DocumentTree = ({
  workspaceId,
  initialTree,
  canCreate,
  autoOpen,
  onAutoOpenHandled,
}: DocumentTreeProps) => {
  const navigate = useNavigate();
  const [tree, setTree] = useState<TreeNode[]>(initialTree);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Expand all on first load
  useEffect(() => {
    const all = new Set<string>();
    collectFolderIds(initialTree, all);
    setExpanded(all);
  }, [initialTree]);

  const totalDocs = useMemo(() => countDocs(tree), [tree]);

  const [createDocTarget, setCreateDocTarget] = useState<{
    parentId: string | null;
    parentName: string | null;
  } | null>(null);
  const [createFolderTarget, setCreateFolderTarget] = useState<{
    parentId: string | null;
    parentName: string | null;
  } | null>(null);

  // Allow parent (page header buttons) to imperatively open a root-level dialog.
  useEffect(() => {
    if (!autoOpen) return;
    if (autoOpen === "doc") setCreateDocTarget({ parentId: null, parentName: null });
    if (autoOpen === "folder") setCreateFolderTarget({ parentId: null, parentName: null });
    onAutoOpenHandled?.();
  }, [autoOpen, onAutoOpenHandled]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => {
    const all = new Set<string>();
    collectFolderIds(tree, all);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  const handleCreateDoc = (title: string, templateId: string) => {
    // Non-blank template → hand off to the full /documents/new page so the
    // template scaffold can be previewed and the body pre-filled.
    if (templateId && templateId !== "doc-blank") {
      const params = new URLSearchParams({ title, template: templateId });
      const parentId = createDocTarget?.parentId;
      if (parentId) params.set("folder", parentId);
      setCreateDocTarget(null);
      navigate(`/w/${workspaceId}/documents/new?${params.toString()}`);
      return;
    }
    const id = `doc-${Date.now()}`;
    const newDoc: TreeDocumentNode = {
      type: "document",
      id,
      title,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    setTree((t) => insertChild(t, createDocTarget?.parentId ?? null, newDoc));
    setCreateDocTarget(null);
    toast.success(`Created "${title}"`);
  };

  const handleCreateFolder = (name: string) => {
    const id = `folder-${Date.now()}`;
    const newFolder: TreeFolderNode = { type: "folder", id, name, children: [] };
    setTree((t) => insertChild(t, createFolderTarget?.parentId ?? null, newFolder));
    setCreateFolderTarget(null);
    toast.success(`Created folder "${name}"`);
  };

  const handleRenameFolder = (folder: TreeFolderNode) => {
    const newName = prompt("Rename folder:", folder.name);
    if (!newName || newName.trim() === folder.name) return;
    setTree((t) => renameFolder(t, folder.id, newName.trim()));
    toast.success("Folder renamed");
  };

  const handleDeleteFolder = (folder: TreeFolderNode) => {
    if (!confirm(`Delete "${folder.name}"? The folder must be empty.`)) return;
    const empty = findFolderEmpty(tree, folder.id);
    if (empty === false) {
      toast.error("Folder is not empty. Move or delete its contents first.");
      return;
    }
    setTree((t) => removeNode(t, folder.id));
    toast.success("Folder deleted");
  };

  const handleDeleteDocument = (doc: TreeDocumentNode) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setTree((t) => removeNode(t, doc.id));
    toast.success("Document deleted");
  };

  return (
    <>
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        {/* Tree header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50/50">
          <span className="font-mono text-[10px] text-stone-400 tracking-[0.1em] uppercase">
            Workspace files · {totalDocs} {totalDocs === 1 ? "doc" : "docs"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Expand all folders"
            >
              Expand all
            </button>
            <span className="text-stone-300" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Collapse all folders"
            >
              Collapse all
            </button>
          </div>
        </div>

        {/* Tree */}
        <div role="tree" aria-label="Document tree" className="py-1">
          {tree.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-10 w-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto">
                <FileText className="h-5 w-5 text-stone-400" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 mt-4">
                {canCreate ? "No documents yet" : "No documents"}
              </h3>
              <p className="text-sm text-stone-500 mt-1.5 max-w-sm mx-auto">
                {canCreate
                  ? "Create your first document to start collaborating with your team."
                  : "No documents have been created in this workspace yet."}
              </p>
              {canCreate && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setCreateFolderTarget({ parentId: null, parentName: null })}
                    className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <FolderPlus className="h-3.5 w-3.5 text-stone-500" />
                    New folder
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateDocTarget({ parentId: null, parentName: null })}
                    className="h-9 px-5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <FilePlus className="h-3.5 w-3.5" />
                    New document
                  </button>
                </div>
              )}
            </div>
          ) : (
            tree.map((node) =>
              node.type === "folder" ? (
                <TreeFolderRow
                  key={node.id}
                  folder={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggle}
                  workspaceId={workspaceId}
                  canCreate={canCreate}
                  onCreateDoc={(parentId, parentName) =>
                    setCreateDocTarget({ parentId, parentName })
                  }
                  onCreateFolder={(parentId, parentName) =>
                    setCreateFolderTarget({ parentId, parentName })
                  }
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onDeleteDocument={handleDeleteDocument}
                />
              ) : (
                <TreeDocumentRow
                  key={node.id}
                  document={node}
                  depth={0}
                  workspaceId={workspaceId}
                  canCreate={canCreate}
                  onDelete={handleDeleteDocument}
                />
              ),
            )
          )}
        </div>
      </div>

      {createDocTarget && (
        <TreeCreateDialog
          open
          kind="document"
          folderName={createDocTarget.parentName}
          onClose={() => setCreateDocTarget(null)}
          onCreated={handleCreateDoc}
        />
      )}
      {createFolderTarget && (
        <TreeCreateDialog
          open
          kind="folder"
          parentName={createFolderTarget.parentName}
          onClose={() => setCreateFolderTarget(null)}
          onCreated={handleCreateFolder}
        />
      )}
    </>
  );
};

interface FolderRowProps {
  folder: TreeFolderNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  workspaceId: string;
  canCreate: boolean;
  onCreateDoc: (parentId: string, parentName: string) => void;
  onCreateFolder: (parentId: string, parentName: string) => void;
  onRenameFolder: (folder: TreeFolderNode) => void;
  onDeleteFolder: (folder: TreeFolderNode) => void;
  onDeleteDocument: (doc: TreeDocumentNode) => void;
}

const TreeFolderRow = ({
  folder,
  depth,
  expanded,
  onToggle,
  workspaceId,
  canCreate,
  onCreateDoc,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteDocument,
}: FolderRowProps) => {
  const isExpanded = expanded.has(folder.id);

  return (
    <div role="treeitem" aria-expanded={isExpanded} aria-level={depth + 1} aria-selected="false">
      <button
        type="button"
        className="group flex items-center h-8 cursor-pointer select-none hover:bg-stone-50 transition-colors duration-100 pr-2 focus-visible:outline-none focus-visible:bg-stone-50"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onToggle(folder.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(folder.id);
          }
          if (e.key === "ArrowRight" && !isExpanded) {
            e.preventDefault();
            onToggle(folder.id);
          }
          if (e.key === "ArrowLeft" && isExpanded) {
            e.preventDefault();
            onToggle(folder.id);
          }
        }}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${folder.name}`}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-stone-300 flex-shrink-0 mr-1 transition-transform duration-150",
            isExpanded && "rotate-90 text-stone-400",
          )}
          aria-hidden="true"
        />
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-teal-600 flex-shrink-0 mr-2" aria-hidden="true" />
        ) : (
          <Folder className="h-4 w-4 text-stone-400 flex-shrink-0 mr-2" aria-hidden="true" />
        )}
        <span className="text-sm text-stone-700 truncate flex-1 group-hover:text-stone-900 transition-colors duration-100">
          {folder.name}
        </span>
        <span className="font-mono text-[10px] text-stone-300 mr-2 group-hover:text-stone-400 transition-colors">
          {folder.children.length}
        </span>
        {canCreate && (
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100">
            <TreeContextMenu
              type="folder"
              name={folder.name}
              onNewDoc={() => onCreateDoc(folder.id, folder.name)}
              onNewFolder={() => onCreateFolder(folder.id, folder.name)}
              onRename={() => onRenameFolder(folder)}
              onDelete={() => onDeleteFolder(folder)}
            />
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-stone-200"
            style={{ left: `${depth * 20 + 16}px` }}
            aria-hidden="true"
          />
          {folder.children.length === 0 ? (
            <div
              className="h-7 flex items-center text-[11px] text-stone-400 italic"
              style={{ paddingLeft: `${(depth + 1) * 20 + 28}px` }}
            >
              Empty folder
            </div>
          ) : (
            folder.children.map((child) =>
              child.type === "folder" ? (
                <TreeFolderRow
                  key={child.id}
                  folder={child}
                  depth={depth + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                  workspaceId={workspaceId}
                  canCreate={canCreate}
                  onCreateDoc={onCreateDoc}
                  onCreateFolder={onCreateFolder}
                  onRenameFolder={onRenameFolder}
                  onDeleteFolder={onDeleteFolder}
                  onDeleteDocument={onDeleteDocument}
                />
              ) : (
                <TreeDocumentRow
                  key={child.id}
                  document={child}
                  depth={depth + 1}
                  workspaceId={workspaceId}
                  canCreate={canCreate}
                  onDelete={onDeleteDocument}
                />
              ),
            )
          )}
        </div>
      )}
    </div>
  );
};

interface DocumentRowProps {
  document: TreeDocumentNode;
  depth: number;
  workspaceId: string;
  canCreate: boolean;
  onDelete: (doc: TreeDocumentNode) => void;
}

const TreeDocumentRow = ({
  document: doc,
  depth,
  workspaceId,
  canCreate,
  onDelete,
}: DocumentRowProps) => {
  return (
    <div role="treeitem" aria-level={depth + 1} aria-selected="false">
      <Link
        to={`/w/${workspaceId}/documents/${doc.id}`}
        className="group flex items-center h-8 hover:bg-stone-50 transition-colors duration-100 pr-2 focus-visible:outline-none focus-visible:bg-stone-50"
        style={{ paddingLeft: `${depth * 20 + 28}px` }}
      >
        <FileText
          className="h-4 w-4 text-stone-400 flex-shrink-0 mr-2 group-hover:text-teal-600 transition-colors duration-150"
          aria-hidden="true"
        />
        <span className="text-sm text-stone-700 truncate flex-1 group-hover:text-teal-700 transition-colors duration-150">
          {doc.title}
        </span>
        <div className="flex items-center gap-1.5 mr-2 flex-shrink-0">
          {doc.isLocked && (
            <Lock
              className="h-3 w-3 text-amber-500"
              aria-label={`Locked by ${doc.lockedBy?.fullName ?? "unknown"}`}
            />
          )}
          {doc.status !== "draft" && (
            <span
              className={cn(
                "text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border leading-none",
                doc.status === "submitted" && "bg-amber-50 text-amber-600 border-amber-200",
                doc.status === "changes_requested" && "bg-red-50 text-red-600 border-red-200",
                doc.status === "approved" && "bg-emerald-50 text-emerald-600 border-emerald-200",
                doc.status === "archived" && "bg-stone-100 text-stone-500 border-stone-200",
              )}
            >
              {doc.status === "changes_requested" ? "CHANGES" : doc.status.toUpperCase()}
            </span>
          )}
          {isRecentlyEdited(doc.updatedAt) && (
            <div
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              title="Recently edited"
              aria-label="Recently edited"
            />
          )}
          <time
            dateTime={doc.updatedAt}
            title={fullDateTime(doc.updatedAt)}
            className="font-mono text-[10px] text-stone-300 tracking-wider group-hover:text-stone-400 transition-colors hidden sm:inline"
          >
            {relativeTime(doc.updatedAt)}
          </time>
        </div>
        {canCreate && (
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100">
            <TreeContextMenu
              type="document"
              name={doc.title}
              onDelete={() => onDelete(doc)}
            />
          </div>
        )}
      </Link>
    </div>
  );
};
