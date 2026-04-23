import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SEED_THREADS_BY_DOCUMENT,
  type CommentNode,
  type CommentThread,
} from "@/lib/mock-comments";

export type CommentFilter = "open" | "resolved";

interface UseDocumentCommentsArgs {
  documentId: string;
  currentUserId: string;
}

interface CreateThreadArgs {
  body: CommentNode[];
  anchorSnippet?: string | null;
}

export function useDocumentComments({ documentId, currentUserId }: UseDocumentCommentsArgs) {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [filter, setFilter] = useState<CommentFilter>("open");

  // Reset when switching documents
  useEffect(() => {
    setThreads(SEED_THREADS_BY_DOCUMENT[documentId] ?? []);
    setFilter("open");
  }, [documentId]);

  const openCount = useMemo(() => threads.filter((t) => !t.resolved).length, [threads]);
  const resolvedCount = useMemo(() => threads.filter((t) => t.resolved).length, [threads]);

  const visibleThreads = useMemo(() => {
    const list = filter === "open" ? threads.filter((t) => !t.resolved) : threads.filter((t) => t.resolved);
    // Sort: anchored first (top-down by document), then general, newest last
    return [...list].sort((a, b) => {
      if (!!a.anchor !== !!b.anchor) return a.anchor ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [threads, filter]);

  const createThread = useCallback(
    ({ body, anchorSnippet }: CreateThreadArgs) => {
      const id = `t-${Date.now()}`;
      const thread: CommentThread = {
        id,
        documentId,
        anchor: anchorSnippet ? { snippet: anchorSnippet, status: "ok" } : null,
        authorId: currentUserId,
        body,
        createdAt: new Date().toISOString(),
        resolved: false,
        replies: [],
      };
      setThreads((prev) => [...prev, thread]);
      return thread;
    },
    [documentId, currentUserId],
  );

  const replyToThread = useCallback(
    (threadId: string, body: CommentNode[]) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                replies: [
                  ...t.replies,
                  {
                    id: `r-${Date.now()}`,
                    authorId: currentUserId,
                    body,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : t,
        ),
      );
    },
    [currentUserId],
  );

  const toggleResolve = useCallback(
    (threadId: string) => {
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          if (t.resolved) {
            return { ...t, resolved: false, resolvedAt: undefined, resolvedBy: undefined };
          }
          return {
            ...t,
            resolved: true,
            resolvedAt: new Date().toISOString(),
            resolvedBy: currentUserId,
          };
        }),
      );
    },
    [currentUserId],
  );

  return {
    threads,
    visibleThreads,
    filter,
    setFilter,
    openCount,
    resolvedCount,
    createThread,
    replyToThread,
    toggleResolve,
  };
}
