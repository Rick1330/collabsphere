import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Folder, FolderOpen, FileText, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TreeNode,
  TreeDocumentNode,
  TreeFolderNode,
} from "@/features/documents/components/document-tree";

interface FolderRowProps {
  folder: TreeFolderNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  workspaceId: string;
  activeDocumentId: string | null;
  onNavigate?: () => void;
}

interface DocumentRowProps {
  document: TreeDocumentNode;
  depth: number;
  workspaceId: string;
  activeDocumentId: string | null;
  onNavigate?: () => void;
}

const INDENT_PX = 14;
const ROW_BASE_PADDING = 8;

export const TreePanelFolderRow = ({
  folder,
  depth,
  expanded,
  onToggle,
  workspaceId,
  activeDocumentId,
  onNavigate,
}: FolderRowProps) => {
  const isExpanded = expanded.has(folder.id);

  return (
    <div role="treeitem" aria-expanded={isExpanded} aria-level={depth + 1}>
      <button
        type="button"
        className="group w-full flex items-center h-7 select-none hover:bg-stone-100/70 transition-colors duration-100 pr-1.5 focus-visible:outline-none focus-visible:bg-stone-100"
        style={{ paddingLeft: `${depth * INDENT_PX + ROW_BASE_PADDING}px` }}
        onClick={() => onToggle(folder.id)}
        onKeyDown={(e) => {
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
            "h-3 w-3 text-stone-300 flex-shrink-0 mr-1 transition-transform duration-150",
            isExpanded && "rotate-90 text-stone-400",
          )}
          aria-hidden="true"
        />
        {isExpanded ? (
          <FolderOpen className="h-3.5 w-3.5 text-teal-600 flex-shrink-0 mr-1.5" aria-hidden="true" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-stone-400 flex-shrink-0 mr-1.5" aria-hidden="true" />
        )}
        <span className="text-[13px] text-stone-700 truncate flex-1 text-left group-hover:text-stone-900 transition-colors duration-100">
          {folder.name}
        </span>
        <span className="font-mono text-[10px] text-stone-300 group-hover:text-stone-400 transition-colors">
          {folder.children.length}
        </span>
      </button>

      {isExpanded && (
        <div role="group" className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-stone-200/70"
            style={{ left: `${depth * INDENT_PX + ROW_BASE_PADDING + 6}px` }}
            aria-hidden="true"
          />
          {folder.children.length === 0 ? (
            <div
              className="h-6 flex items-center text-[11px] text-stone-400 italic"
              style={{ paddingLeft: `${(depth + 1) * INDENT_PX + ROW_BASE_PADDING + 16}px` }}
            >
              Empty folder
            </div>
          ) : (
            folder.children.map((child) => (
              <TreePanelNodeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                workspaceId={workspaceId}
                activeDocumentId={activeDocumentId}
                onNavigate={onNavigate}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const TreePanelDocumentRow = ({
  document: doc,
  depth,
  workspaceId,
  activeDocumentId,
  onNavigate,
}: DocumentRowProps) => {
  const isActive = activeDocumentId === doc.id;
  const ref = useRef<HTMLAnchorElement>(null);

  // Auto-scroll the active row into view when it mounts or becomes active.
  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [isActive]);

  return (
    <div role="treeitem" aria-level={depth + 1} aria-current={isActive ? "page" : undefined}>
      <Link
        ref={ref}
        to={`/w/${workspaceId}/documents/${doc.id}`}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center h-7 pr-2 transition-colors duration-100 focus-visible:outline-none focus-visible:bg-stone-100",
          isActive
            ? "bg-teal-50/80 text-teal-700"
            : "text-stone-700 hover:bg-stone-100/70 hover:text-stone-900",
        )}
        style={{ paddingLeft: `${depth * INDENT_PX + ROW_BASE_PADDING + 14}px` }}
      >
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-teal-600"
          />
        )}
        <FileText
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0 mr-1.5 transition-colors duration-150",
            isActive
              ? "text-teal-600"
              : "text-stone-400 group-hover:text-stone-600",
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "text-[13px] truncate flex-1",
            isActive && "font-medium",
          )}
        >
          {doc.title}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {doc.isLocked && (
            <Lock
              className="h-2.5 w-2.5 text-amber-500"
              aria-label={`Locked by ${doc.lockedBy?.fullName ?? "unknown"}`}
            />
          )}
          {doc.status !== "draft" && (
            <span
              className={cn(
                "text-[8px] font-mono tracking-wider uppercase px-1 py-px rounded border leading-none",
                doc.status === "submitted" &&
                  "bg-amber-50 text-amber-600 border-amber-200",
                doc.status === "changes_requested" &&
                  "bg-red-50 text-red-600 border-red-200",
                doc.status === "approved" &&
                  "bg-emerald-50 text-emerald-600 border-emerald-200",
                doc.status === "archived" &&
                  "bg-stone-100 text-stone-500 border-stone-200",
              )}
            >
              {doc.status === "changes_requested" ? "•" : doc.status[0].toUpperCase()}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

interface NodeRowProps {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  workspaceId: string;
  activeDocumentId: string | null;
  onNavigate?: () => void;
}

export const TreePanelNodeRow = ({
  node,
  depth,
  expanded,
  onToggle,
  workspaceId,
  activeDocumentId,
  onNavigate,
}: NodeRowProps) => {
  if (node.type === "folder") {
    return (
      <TreePanelFolderRow
        folder={node}
        depth={depth}
        expanded={expanded}
        onToggle={onToggle}
        workspaceId={workspaceId}
        activeDocumentId={activeDocumentId}
        onNavigate={onNavigate}
      />
    );
  }
  return (
    <TreePanelDocumentRow
      document={node}
      depth={depth}
      workspaceId={workspaceId}
      activeDocumentId={activeDocumentId}
      onNavigate={onNavigate}
    />
  );
};
