/**
 * Loads the document tree for a workspace via the API adapter.
 *
 * Pages render against the returned `tree` once `state === "loaded"`. The
 * tree itself is mutable inside the editor / tree-panel surfaces; the hook
 * just owns the initial fetch + retry seam so pages stop importing mock
 * data directly.
 */
import { useEffect, useState } from "react";
import { getDocumentTree, type TreeNode } from "@/api/adapters/documents";

export type DocumentTreeState = "loading" | "loaded" | "error";

export interface UseDocumentTreeResult {
  tree: TreeNode[];
  state: DocumentTreeState;
  reload: () => void;
}

export function useDocumentTree(workspaceId: string): UseDocumentTreeResult {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [state, setState] = useState<DocumentTreeState>("loading");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getDocumentTree(workspaceId)
      .then((data) => {
        if (cancelled) return;
        setTree(data);
        setState("loaded");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, tick]);

  return { tree, state, reload: () => setTick((t) => t + 1) };
}
