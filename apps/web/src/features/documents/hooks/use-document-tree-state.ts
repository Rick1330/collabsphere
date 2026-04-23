import { useCallback, useEffect, useMemo, useState } from "react";
import type { TreeNode, TreeFolderNode } from "@/features/documents/components/document-tree";

const collectAllFolderIds = (nodes: TreeNode[], target: Set<string>) => {
  for (const node of nodes) {
    if (node.type === "folder") {
      target.add(node.id);
      collectAllFolderIds(node.children, target);
    }
  }
};

// Walk the tree to find the chain of ancestor folder IDs for a given doc id.
const findAncestorFolders = (
  nodes: TreeNode[],
  docId: string,
  trail: string[] = [],
): string[] | null => {
  for (const node of nodes) {
    if (node.type === "document" && node.id === docId) return trail;
    if (node.type === "folder") {
      const found = findAncestorFolders(node.children, docId, [...trail, node.id]);
      if (found) return found;
    }
  }
  return null;
};

const findFolder = (nodes: TreeNode[], id: string): TreeFolderNode | null => {
  for (const node of nodes) {
    if (node.type === "folder") {
      if (node.id === id) return node;
      const sub = findFolder(node.children, id);
      if (sub) return sub;
    }
  }
  return null;
};

interface UseDocumentTreeStateOptions {
  tree: TreeNode[];
  activeDocumentId?: string | null;
}

/**
 * Manages expansion + insertion behavior for the editor-context tree.
 *
 * - Expands all folders on first load
 * - Always ensures the ancestor chain of the active document is expanded so
 *   the active row is visible without manual interaction
 * - Preserves expansion state when the active doc changes within the same
 *   tree (so users don't lose context while navigating)
 */
export function useDocumentTreeState({ tree, activeDocumentId }: UseDocumentTreeStateOptions) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    collectAllFolderIds(tree, initial);
    return initial;
  });

  // When the active document changes, ensure its ancestor folders are open.
  useEffect(() => {
    if (!activeDocumentId) return;
    const ancestors = findAncestorFolders(tree, activeDocumentId);
    if (!ancestors || ancestors.length === 0) return;
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of ancestors) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tree, activeDocumentId]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Set<string>();
    collectAllFolderIds(tree, all);
    setExpanded(all);
  }, [tree]);

  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  const findFolderById = useCallback(
    (id: string) => findFolder(tree, id),
    [tree],
  );

  return useMemo(
    () => ({ expanded, toggle, expandAll, collapseAll, findFolderById }),
    [expanded, toggle, expandAll, collapseAll, findFolderById],
  );
}
