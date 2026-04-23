import { useCallback, useState } from "react";

/**
 * Tracks which comment thread is the active focus across the editor and rail.
 * Selecting a thread highlights the matching anchor in the editor; clicking
 * an anchor focuses the corresponding thread in the rail.
 */
export function useDocumentThreadFocus() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [flashAnchorId, setFlashAnchorId] = useState<string | null>(null);

  const focusThread = useCallback((threadId: string | null) => {
    setActiveThreadId(threadId);
  }, []);

  const flashAnchor = useCallback((threadId: string) => {
    setFlashAnchorId(threadId);
    window.setTimeout(() => {
      setFlashAnchorId((cur) => (cur === threadId ? null : cur));
    }, 1500);
  }, []);

  return { activeThreadId, focusThread, flashAnchorId, flashAnchor };
}
