import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileX, RefreshCw, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTiptapEditor } from "@/features/documents/hooks/use-tiptap-editor";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDocumentComments } from "@/features/documents/hooks/use-document-comments";
import { useDocumentThreadFocus } from "@/features/documents/hooks/use-document-thread-focus";
import { useAnchorDecorations } from "@/features/documents/hooks/use-anchor-decorations";
import { AVATAR_COLORS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDocumentTree } from "@/features/documents/hooks/use-document-tree";
import { listWorkspaceMembers } from "@/api/adapters/tasks";
import { EditorHeader, type EditorDocument } from "@/features/documents/components/editor/editor-header";
import {
  EditorReadOnlyBanner,
  type ReadOnlyReason,
} from "@/features/documents/components/editor/editor-readonly-banner";
import { EditorToolbar } from "@/features/documents/components/editor/editor-toolbar";
import { EditorContentArea } from "@/features/documents/components/editor/editor-content";
import { EditorSlashCommand } from "@/features/documents/components/editor/editor-slash-command";
import {
  EditorStatusBar,
  type ConnectionStatus,
  type SaveStatus,
} from "@/features/documents/components/editor/editor-status-bar";
import type { PresenceUser } from "@/features/documents/components/editor/editor-presence";
import { DocumentTreePanel } from "@/features/documents/components/tree/document-tree-panel";
import { TreeCreateDialog } from "@/features/documents/components/tree-create-dialog";
import { DocumentCommentsRail } from "@/features/documents/components/comments/document-comments-rail";
import { DocumentInlineCommentTrigger } from "@/features/documents/components/comments/document-inline-comment-trigger";
import { DocumentCommentComposer } from "@/features/documents/components/comments/document-comment-composer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditorSubmitDialog } from "@/features/documents/components/editor/editor-submit-dialog";
import { EditorReviewPanel } from "@/features/documents/components/editor/editor-review-panel";
import { EditorReviewFeedback } from "@/features/documents/components/editor/editor-review-feedback";
import { EditorSubmissionHistory } from "@/features/documents/components/editor/editor-submission-history";
import {
  MOCK_SUBMISSION_HISTORY,
  type SubmissionRecord,
} from "@/lib/mock-academic";
import type { CommentNode } from "@/lib/mock-comments";
import {
  buildDocumentSeed,
  clearPendingDoc,
  readPendingDoc,
  stashPendingDoc,
} from "@/api/adapters/templates";
import { resolveDocumentParam, resolveWorkspaceParam } from "@/lib/route-params";
import {
  CreateTaskDialog,
  type SourceDocumentLink,
} from "@/features/tasks/components/create-task-dialog";
import {
  STATUS_LABELS,
  type TaskAssignee,
  type TaskPriority,
  type TaskStatus,
  type TaskLinkedResource,
} from "@/api/adapters/tasks";

type WorkspaceRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
type WorkspaceStatus = "active" | "archived";

interface MockWorkspace {
  id: string;
  name: string;
  status: WorkspaceStatus;
  myRole: WorkspaceRole;
  /** Enables academic submit-for-review workflow. */
  isAcademic: boolean;
}

interface MockDocument extends EditorDocument {
  content: string;
  createdBy: { id: string; fullName: string };
}

const CURRENT_USER_ID = "user-jane";

const WORKSPACES: Record<string, MockWorkspace> = {
  alpha: { id: "alpha", name: "Project Alpha", status: "active", myRole: "ADMIN", isAcademic: false },
  thesis: { id: "thesis", name: "Thesis", status: "active", myRole: "MEMBER", isAcademic: true },
  personal: { id: "personal", name: "Personal Notes", status: "active", myRole: "OWNER", isAcademic: false },
  research: { id: "research", name: "Research Group", status: "archived", myRole: "MEMBER", isAcademic: true },
};

const SAMPLE_CONTENT = `
<h1>Project Roadmap Q4</h1>
<p>This document outlines the key deliverables, milestones, and team assignments for the upcoming quarter. All sections are open for collaborative editing — leave inline comments where you'd like clarification.</p>

<h2>Key Milestones</h2>
<ul>
  <li><strong>Beta release</strong> — October 15</li>
  <li><strong>User testing round 2</strong> — November 1</li>
  <li><strong>Production launch</strong> — December 1</li>
</ul>

<h2>Technical Requirements</h2>
<blockquote><p>All API endpoints must follow the standard response envelope format. Versioning lives in the URL prefix.</p></blockquote>
<p>Reference example response shape:</p>
<pre><code>{
  "data": { "document": { "id": "...", "title": "..." } },
  "meta": { "requestId": "req_abc123" }
}</code></pre>

<h2>Open Questions</h2>
<ol>
  <li>Should we ship dark mode in v1.1 or v1.2?</li>
  <li>How do we want to handle <code>archived</code> workspaces in search?</li>
</ol>
<p>Reach out in <a href="https://example.com">#product-roadmap</a> if you want to discuss live.</p>
`.trim();

const DOCUMENTS: Record<string, MockDocument> = {
  "d-roadmap": {
    id: "d-roadmap",
    title: "Project Roadmap Q4",
    status: "approved",
    isLocked: false,
    folderName: "Product",
    content: SAMPLE_CONTENT,
    createdBy: { id: "user-bob", fullName: "Eyob Bekele" },
  },
  "d-prd": {
    id: "d-prd",
    title: "PRD v2",
    status: "changes_requested",
    isLocked: true,
    lockedBy: { id: "user-bob", fullName: "Eyob Bekele" },
    folderName: "Product",
    content: "<h1>PRD v2</h1><p>Draft requirements for the next release.</p>",
    createdBy: { id: "user-bob", fullName: "Eyob Bekele" },
  },
  "d-survey": {
    id: "d-survey",
    title: "User survey results",
    status: "draft",
    isLocked: false,
    folderName: "Research",
    content: "<h1>User survey results</h1><p>Highlights from the latest round.</p>",
    createdBy: { id: CURRENT_USER_ID, fullName: "Elshaday Tesfaye" },
  },
  "d-api": {
    id: "d-api",
    title: "API Design",
    status: "submitted",
    isLocked: false,
    folderName: "Architecture",
    content: "<h1>API Design</h1><p>REST envelope conventions.</p>",
    createdBy: { id: CURRENT_USER_ID, fullName: "Elshaday Tesfaye" },
  },
  "d-adr": {
    id: "d-adr",
    title: "ADR-003 Prisma",
    status: "approved",
    isLocked: false,
    folderName: "Architecture",
    content: "<h1>ADR-003 Prisma</h1><p>We will adopt Prisma for the data layer.</p>",
    createdBy: { id: "user-bob", fullName: "Eyob Bekele" },
  },
  "d-retro": {
    id: "d-retro",
    title: "Sprint Retro Week 12",
    status: "draft",
    isLocked: false,
    folderName: "Meetings",
    content: "<h1>Sprint Retro Week 12</h1><p>What went well, what didn't.</p>",
    createdBy: { id: CURRENT_USER_ID, fullName: "Elshaday Tesfaye" },
  },
  "d-readme": {
    id: "d-readme",
    title: "README",
    status: "approved",
    isLocked: false,
    folderName: null,
    content: "<h1>README</h1><p>Welcome to the workspace.</p>",
    createdBy: { id: CURRENT_USER_ID, fullName: "Elshaday Tesfaye" },
  },
};

const FALLBACK_DOC: MockDocument = {
  id: "untitled",
  title: "Untitled document",
  status: "draft",
  isLocked: false,
  folderName: null,
  content:
    "<h1>Untitled document</h1><p>Start writing your first paragraph here. Press <code>/</code> for commands (coming soon).</p>",
  createdBy: { id: CURRENT_USER_ID, fullName: "Elshaday Tesfaye" },
};

function getReadOnlyReason(
  doc: MockDocument,
  ws: MockWorkspace,
  currentUserId: string,
): ReadOnlyReason | null {
  if (ws.status === "archived") return "workspace-archived";
  if (doc.status === "archived") return "archived";
  if (ws.myRole === "VIEWER") return "viewer";
  if (doc.isLocked) {
    const isLockOwner = doc.lockedBy?.id === currentUserId;
    const isAdminOrOwner = ws.myRole === "OWNER" || ws.myRole === "ADMIN";
    if (!isLockOwner && !isAdminOrOwner) return "locked";
  }
  // Submitted: read-only for everyone except supervisors (who use the review panel)
  if (doc.status === "submitted") {
    const isSupervisor =
      ws.myRole === "OWNER" || ws.myRole === "ADMIN" || ws.myRole === "MANAGER";
    if (!isSupervisor) return "submitted";
    // Supervisors review via the panel — keep editor read-only during review.
    return "submitted";
  }
  if (doc.status === "approved") {
    const isSupervisor =
      ws.myRole === "OWNER" || ws.myRole === "ADMIN" || ws.myRole === "MANAGER";
    if (!isSupervisor) return "approved";
  }
  // changes_requested: editable for the submitter (doc creator) so they can fix.
  return null;
}

const MOCK_PRESENCE: PresenceUser[] = [
  { id: CURRENT_USER_ID, fullName: "Elshaday Tesfaye", color: AVATAR_COLORS[0] },
  { id: "user-alex", fullName: "Yonas Girma", color: AVATAR_COLORS[2] },
  { id: "user-mira", fullName: "Hiwot Mengistu", color: AVATAR_COLORS[1] },
];

// ---------- Tree skeleton (left panel during load) ----------
const TreeSkeleton = () => (
  <div className="flex flex-col h-full bg-stone-50/60 border-r border-stone-200">
    <div className="h-12 px-3 border-b border-stone-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-2 w-16 rounded" />
        </div>
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </div>
    <div className="flex-1 px-2 py-3 space-y-1.5">
      <Skeleton className="h-6 w-full rounded" />
      <div className="pl-5 space-y-1.5">
        <Skeleton className="h-6 w-[90%] rounded" />
        <Skeleton className="h-6 w-[85%] rounded bg-teal-100/60" />
        <Skeleton className="h-6 w-[80%] rounded" />
      </div>
      <Skeleton className="h-6 w-full rounded" />
      <div className="pl-5 space-y-1.5">
        <Skeleton className="h-6 w-[88%] rounded" />
        <Skeleton className="h-6 w-[78%] rounded" />
      </div>
      <Skeleton className="h-6 w-full rounded" />
    </div>
  </div>
);

const EditorCenterSkeleton = () => (
  <div className="flex-1 min-w-0 flex flex-col bg-white">
    <div className="flex items-center gap-3 h-12 px-4 border-b border-stone-200 flex-shrink-0">
      <Skeleton className="h-7 w-7 rounded-md" />
      <Skeleton className="h-4 w-12 rounded" />
      <Skeleton className="h-3 w-3 rounded" />
      <Skeleton className="h-4 w-32 rounded" />
      <div className="flex-1" />
      <div className="flex -space-x-1.5">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md" />
    </div>
    <div className="flex items-center gap-1 h-10 px-4 border-b border-stone-100 flex-shrink-0">
      {Array.from({ length: 14 }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-7 rounded-md" />
      ))}
    </div>
    <div className="flex-1 bg-white overflow-hidden">
      <div className="max-w-3xl mx-auto px-10 py-12 space-y-4">
        <Skeleton className="h-9 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
        <div className="h-6" />
        <Skeleton className="h-6 w-1/2 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
      </div>
    </div>
    <div className="flex items-center justify-between h-8 px-4 border-t border-stone-100 bg-stone-50/50 flex-shrink-0">
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="h-3 w-16 rounded" />
    </div>
  </div>
);

const EditorShellSkeleton = () => (
  <div className="app-light flex h-screen bg-stone-50">
    <div className="hidden lg:flex w-[280px] flex-shrink-0">
      <TreeSkeleton />
    </div>
    <EditorCenterSkeleton />
  </div>
);

interface DocumentEditorState {
  status: "loading" | "error" | "loaded";
  doc: MockDocument | null;
  workspace: MockWorkspace | null;
}

const DocumentEditorPage = () => {
  const params = useParams();
  const workspaceId = resolveWorkspaceParam(params.workspaceId);
  const documentId = resolveDocumentParam(params.documentId);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Adapter-driven data: tree + assignable workspace members.
  const { tree: documentTree } = useDocumentTree(workspaceId);
  const [workspaceMembers, setWorkspaceMembers] = useState<TaskAssignee[]>([]);
  useEffect(() => {
    let cancelled = false;
    listWorkspaceMembers(workspaceId).then((m) => {
      if (!cancelled) setWorkspaceMembers(m);
    });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const [state, setState] = useState<DocumentEditorState>({
    status: "loading",
    doc: null,
    workspace: null,
  });
  const [retryNonce, setRetryNonce] = useState(0);

  // Mock fetch
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", doc: null, workspace: null });
    const t = window.setTimeout(() => {
      if (cancelled) return;
      const ws = WORKSPACES[workspaceId] ?? {
        id: workspaceId,
        name: workspaceId,
        status: "active" as const,
        myRole: "OWNER" as const,
        isAcademic: false,
      };
      const known = DOCUMENTS[documentId];
      // If this id was created via the new-doc flow, pick up the seeded
      // template content from sessionStorage and surface it as the doc body.
      const pending = !known ? readPendingDoc(documentId) : null;
      const doc: MockDocument = known
        ? { ...known }
        : pending
          ? {
              id: documentId,
              title: pending.title,
              status: "draft",
              isLocked: false,
              folderName: pending.folderName,
              content: pending.contentHTML,
              createdBy: { id: CURRENT_USER_ID, fullName: "Elshaday Tesfaye" },
            }
          : { ...FALLBACK_DOC, id: documentId || "untitled" };
      // Keep the seed around for retries within this tab, but clear once we
      // know the editor mounted with it on this load.
      if (pending) clearPendingDoc(documentId);
      setState({ status: "loaded", doc, workspace: ws });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [workspaceId, documentId, retryNonce]);

  const { doc, workspace } = state;

  // Local doc mutations (lock/unlock, delete-flag)
  const [overrides, setOverrides] = useState<Partial<MockDocument>>({});
  useEffect(() => {
    setOverrides({});
  }, [documentId]);

  const mergedDoc: MockDocument | null = useMemo(
    () => (doc ? { ...doc, ...overrides } : null),
    [doc, overrides],
  );

  // ─────── Academic submission state ───────
  // Per-document submission history (mock-seeded, locally-mutable).
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionRecord[]>([]);
  useEffect(() => {
    setSubmissionHistory(MOCK_SUBMISSION_HISTORY[documentId] ?? []);
  }, [documentId]);

  const readOnlyReason =
    mergedDoc && workspace ? getReadOnlyReason(mergedDoc, workspace, CURRENT_USER_ID) : null;
  const isEditable = state.status === "loaded" && readOnlyReason === null;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (mergedDoc) {
      setContent(mergedDoc.content);
      setSaveStatus("saved");
      setLastSavedAt(new Date().toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedDoc?.id, mergedDoc?.content]);

  const editor = useTiptapEditor({
    content,
    editable: isEditable,
    onUpdate: () => {
      setSaveStatus("unsaved");
    },
  });

  // Auto "save" simulation
  useEffect(() => {
    if (saveStatus !== "unsaved") return;
    const t1 = window.setTimeout(() => setSaveStatus("saving"), 800);
    const t2 = window.setTimeout(() => {
      setSaveStatus("saved");
      setLastSavedAt(new Date().toISOString());
    }, 1400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [saveStatus]);

  // Focus mode + comments rail + mobile drawers
  const [focusMode, setFocusMode] = useState(false);
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);

  // Comment system
  const {
    threads: allThreads,
    visibleThreads,
    filter,
    setFilter,
    openCount,
    resolvedCount,
    createThread,
    replyToThread,
    toggleResolve,
  } = useDocumentComments({
    documentId: mergedDoc?.id ?? "",
    currentUserId: CURRENT_USER_ID,
  });
  const { activeThreadId, focusThread, flashAnchorId, flashAnchor } =
    useDocumentThreadFocus();

  const editorScrollRef = useRef<HTMLDivElement>(null);

  // Floating composer state for inline anchored comments
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(null);
  // Pending "create task from selection" snippet
  const [pendingTaskSnippet, setPendingTaskSnippet] = useState<string | null>(null);

  // Connection truth (mock): cycles to demo states; in real life wired to socket.
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connected");

  const handleAnchorClick = useCallback(
    (threadId: string) => {
      focusThread(threadId);
      // open the rail if it was closed so the focused thread is visible
      if (!commentsOpen) setCommentsOpen(true);
    },
    [focusThread, commentsOpen],
  );

  // Decorate the editor with anchor highlights for each open thread
  useAnchorDecorations({
    editor,
    threads: allThreads,
    activeThreadId,
    flashThreadId: flashAnchorId,
    onAnchorClick: handleAnchorClick,
  });

  // Jump to anchor: scroll the matching decoration into view + flash it
  const handleJumpToAnchor = useCallback(
    (threadId: string) => {
      const scroller = editorScrollRef.current;
      if (!scroller) return;
      const el = scroller.querySelector(`[data-thread-id="${threadId}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        flashAnchor(threadId);
        focusThread(threadId);
      } else {
        toast.info("Anchor text not found", {
          description: "The original text may have been edited.",
        });
      }
    },
    [flashAnchor, focusThread],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSaveStatus("saved");
        setLastSavedAt(new Date().toISOString());
        toast.success("Document saved", {
          description: "All changes have been saved.",
          duration: 1800,
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setFocusMode((f) => {
          const next = !f;
          toast(next ? "Focus mode on" : "Focus mode off", {
            description: next
              ? "Side panels hidden. Press ⌘⇧E to exit."
              : "Side panels restored.",
            duration: 1400,
          });
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Deep-link: scroll to and flash a snippet from `#anchor=` in the URL.
  useEffect(() => {
    if (!editor) return;
    const tryJump = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#anchor=")) return;
      const snippet = decodeURIComponent(hash.slice("#anchor=".length));
      if (!snippet) return;
      const scroller = editorScrollRef.current;
      if (!scroller) return;
      // Small delay so anchor decorations have a chance to mount.
      window.setTimeout(() => {
        const el = scroller.querySelector(
          `[data-thread-id]`,
        ) as HTMLElement | null;
        // Prefer matching by text content; fall back to any decorated anchor.
        const matching = Array.from(
          scroller.querySelectorAll<HTMLElement>("[data-thread-id]"),
        ).find((node) => node.textContent?.includes(snippet));
        const target = matching ?? el;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("is-flashing");
          window.setTimeout(() => target.classList.remove("is-flashing"), 1800);
          return;
        }
        // No anchor decoration: walk the DOM for the raw text.
        const walker = document.createTreeWalker(scroller, NodeFilter.SHOW_TEXT);
        let node: Node | null = walker.nextNode();
        while (node) {
          if (node.textContent && node.textContent.includes(snippet)) {
            const range = document.createRange();
            range.selectNodeContents(node);
            const rect = range.getBoundingClientRect();
            scroller.scrollTo({
              top: scroller.scrollTop + rect.top - scroller.clientHeight / 2,
              behavior: "smooth",
            });
            toast.success("Jumped to linked passage", {
              description: `"${snippet.slice(0, 60)}${snippet.length > 60 ? "…" : ""}"`,
              duration: 2000,
            });
            return;
          }
          node = walker.nextNode();
        }
        toast.info("Linked passage not found", {
          description: "The text may have been edited.",
        });
      }, 250);
    };
    tryJump();
    window.addEventListener("hashchange", tryJump);
    return () => window.removeEventListener("hashchange", tryJump);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, mergedDoc?.id]);

  // Close mobile tree drawer when navigating
  const handleTreeNavigate = useCallback(() => {
    setMobileTreeOpen(false);
  }, []);

  // Title
  useEffect(() => {
    if (mergedDoc) {
      window.document.title = `${mergedDoc.title} — CollabSphere`;
    } else {
      window.document.title = "Document — CollabSphere";
    }
  }, [mergedDoc?.title]);

  // Tree panel quick-create dialogs
  const [createDocOpen, setCreateDocOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const handleCreateDoc = (title: string, templateId: string) => {
    setCreateDocOpen(false);
    // Seed the chosen template into a fresh doc id and open it directly —
    // skipping the /documents/new screen since the user already picked a
    // template inline.
    const newId = `doc-${Date.now().toString(36)}`;
    const seed = buildDocumentSeed(title, templateId, null);
    stashPendingDoc(newId, seed);
    toast.success(`Created "${seed.title}"`, {
      description:
        seed.templateId === "doc-blank"
          ? "Opening new document…"
          : `Seeded from ${seed.templateName}.`,
    });
    navigate(`/w/${workspaceId}/documents/${newId}`);
  };
  const handleCreateFolder = (name: string) => {
    setCreateFolderOpen(false);
    toast.success(`Created folder "${name}"`);
  };

  if (state.status === "loading") return <EditorShellSkeleton />;

  if (state.status === "error" || !mergedDoc || !workspace) {
    return (
      <div className="app-light flex h-screen bg-stone-50">
        {!focusMode && (
          <div className="hidden lg:flex w-[280px] flex-shrink-0">
            <DocumentTreePanel
              workspaceId={workspaceId}
              workspaceName={WORKSPACES[workspaceId]?.name ?? workspaceId}
              tree={documentTree}
              activeDocumentId={null}
              canCreate={false}
            />
          </div>
        )}
        <div className="flex-1 flex items-center justify-center bg-white p-8">
          <div className="text-center max-w-sm">
            <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
              <FileX className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900 mt-4">Document not found</h2>
            <p className="text-sm text-stone-500 mt-1.5">
              This document may have been deleted or you don't have access.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setRetryNonce((n) => n + 1)}
                className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </button>
              <Link
                to={`/w/${workspaceId}/documents`}
                className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canLock =
    workspace.myRole === "OWNER" ||
    workspace.myRole === "ADMIN" ||
    workspace.myRole === "MANAGER";
  const canDelete =
    canLock ||
    (workspace.myRole === "MEMBER" && mergedDoc.createdBy.id === CURRENT_USER_ID);
  const canCreate =
    workspace.status === "active" && workspace.myRole !== "VIEWER";

  const handleToggleLock = () => {
    setOverrides((prev) => {
      const nowLocked = !mergedDoc.isLocked;
      toast.success(nowLocked ? "Document locked" : "Document unlocked");
      return {
        ...prev,
        isLocked: nowLocked,
        lockedBy: nowLocked
          ? { id: CURRENT_USER_ID, fullName: "Elshaday Tesfaye" }
          : undefined,
      };
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${mergedDoc.title}"? This cannot be undone.`)) return;
    toast.success("Document deleted");
    navigate(`/w/${workspaceId}/documents`);
  };

  const treePanel = (
    <DocumentTreePanel
      workspaceId={workspaceId}
      workspaceName={workspace.name}
      tree={documentTree}
      activeDocumentId={mergedDoc.id}
      canCreate={canCreate}
      onNewDoc={() => setCreateDocOpen(true)}
      onNewFolder={() => setCreateFolderOpen(true)}
      onNavigate={handleTreeNavigate}
    />
  );

  const handleStartAnchoredComment = (snippet: string) => {
    setPendingAnchor(snippet);
  };

  const handleSubmitAnchoredComment = (body: CommentNode[]) => {
    if (pendingAnchor === null) return;
    createThread({ body, anchorSnippet: pendingAnchor });
    setPendingAnchor(null);
    if (!commentsOpen) setCommentsOpen(true);
  };

  const handleCreateTaskFromSelection = (params: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    labels?: string[];
    sourceLink?: TaskLinkedResource;
  }) => {
    setPendingTaskSnippet(null);
    toast.success("Task created from document", {
      description: `"${params.title}" added to ${STATUS_LABELS[params.status]}.`,
      action: {
        label: "View board",
        onClick: () => navigate(`/w/${workspaceId}/tasks`),
      },
    });
  };

  const handleCreateGeneralComment = (body: CommentNode[]) => {
    createThread({ body });
    toast.success("Comment posted");
  };

  const handleReply = (threadId: string, body: CommentNode[]) => {
    replyToThread(threadId, body);
  };

  const handleToggleResolve = (threadId: string) => {
    const thread = allThreads.find((t) => t.id === threadId);
    toggleResolve(threadId);
    if (thread) {
      toast.success(thread.resolved ? "Thread reopened" : "Thread resolved");
    }
  };

  // Comment composer permissions: viewers/archived workspaces can read but not write
  const canComment =
    workspace.status === "active" &&
    workspace.myRole !== "VIEWER" &&
    readOnlyReason !== "archived";
  const canResolveThreads =
    workspace.myRole === "OWNER" ||
    workspace.myRole === "ADMIN" ||
    workspace.myRole === "MANAGER";

  const showDesktopComments = commentsOpen && !focusMode;

  // ─────────── Academic workflow ───────────
  const isSupervisor =
    workspace.myRole === "OWNER" ||
    workspace.myRole === "ADMIN" ||
    workspace.myRole === "MANAGER";
  const isSubmitter = mergedDoc.createdBy.id === CURRENT_USER_ID;
  const academicEnabled = workspace.isAcademic && workspace.status === "active";

  // Most recent submission record (used for review panel + feedback banner)
  const latestSubmission: SubmissionRecord | undefined = submissionHistory[0];
  const pendingSubmission =
    latestSubmission && !latestSubmission.decision ? latestSubmission : undefined;
  const lastChangesRequested =
    latestSubmission && latestSubmission.decision === "changes_requested"
      ? latestSubmission
      : undefined;

  // Surface visibility
  const showReviewPanel =
    academicEnabled &&
    isSupervisor &&
    mergedDoc.status === "submitted" &&
    !!pendingSubmission;
  const showFeedbackBanner =
    academicEnabled &&
    mergedDoc.status === "changes_requested" &&
    !!lastChangesRequested;
  const showSubmissionHistory = academicEnabled && submissionHistory.length > 0;

  // Submit eligibility (student perspective)
  const canSubmitForReview =
    academicEnabled &&
    !isSupervisor &&
    isSubmitter &&
    (mergedDoc.status === "draft" || mergedDoc.status === "changes_requested") &&
    workspace.myRole !== "VIEWER";

  const isResubmission = mergedDoc.status === "changes_requested";
  const docHasContent =
    !!editor && editor.getText().trim().length > 5;

  // ── Submission handlers ──

  const nextVersionLabel = () => {
    const num = submissionHistory.length + 1;
    return `v${num}`;
  };

  const handleConfirmSubmit = (note: string | undefined) => {
    const newRecord: SubmissionRecord = {
      id: `sub-${Date.now()}`,
      documentId: mergedDoc.id,
      submittedById: CURRENT_USER_ID,
      submittedByName: "Elshaday Tesfaye",
      submittedAt: new Date().toISOString(),
      submissionNote: note,
      versionLabel: nextVersionLabel(),
    };
    setSubmissionHistory((prev) => [newRecord, ...prev]);
    setOverrides((prev) => ({ ...prev, status: "submitted" }));
    setSubmitDialogOpen(false);
    toast.success(isResubmission ? "Resubmitted for review" : "Submitted for review", {
      description: "Your supervisor has been notified.",
    });
  };

  const handleApprove = (note: string | undefined) => {
    if (!pendingSubmission) return;
    const decided: SubmissionRecord = {
      ...pendingSubmission,
      decision: "approved",
      decidedById: CURRENT_USER_ID,
      decidedByName: "Elshaday Tesfaye",
      decidedAt: new Date().toISOString(),
      decisionNote: note,
    };
    setSubmissionHistory((prev) => [decided, ...prev.slice(1)]);
    setOverrides((prev) => ({ ...prev, status: "approved" }));
    toast.success("Document approved", {
      description: "The author has been notified.",
    });
  };

  const handleRequestChanges = (note: string) => {
    if (!pendingSubmission) return;
    const decided: SubmissionRecord = {
      ...pendingSubmission,
      decision: "changes_requested",
      decidedById: CURRENT_USER_ID,
      decidedByName: "Elshaday Tesfaye",
      decidedAt: new Date().toISOString(),
      decisionNote: note,
    };
    setSubmissionHistory((prev) => [decided, ...prev.slice(1)]);
    setOverrides((prev) => ({ ...prev, status: "changes_requested" }));
    toast.success("Changes requested", {
      description: "The author can now revise and resubmit.",
    });
  };

  const submitButton = canSubmitForReview ? (
    <button
      type="button"
      onClick={() => setSubmitDialogOpen(true)}
      className={cn(
        "h-7 px-2.5 rounded-md text-[12px] font-semibold transition-colors duration-100 flex items-center gap-1.5 shadow-sm",
        isResubmission
          ? "bg-amber-600 hover:bg-amber-500 text-white"
          : "bg-amber-600 hover:bg-amber-500 text-white",
      )}
      title={isResubmission ? "Resubmit for review" : "Submit for review"}
    >
      {isResubmission ? (
        <RotateCcw className="h-3.5 w-3.5" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      <span className="hidden md:inline">
        {isResubmission ? "Resubmit" : "Submit for review"}
      </span>
    </button>
  ) : null;


  return (
    <div className="app-light flex h-screen bg-stone-50 overflow-hidden">
      {/* Desktop tree (hidden in focus mode) */}
      <div
        className={cn(
          "hidden lg:flex flex-shrink-0 transition-[width] duration-300 ease-out overflow-hidden",
          focusMode ? "w-0" : "w-[280px]",
        )}
        aria-hidden={focusMode}
      >
        <div className="w-[280px] h-full">{treePanel}</div>
      </div>

      {/* Mobile/tablet tree drawer */}
      {isMobile && (
        <Sheet open={mobileTreeOpen} onOpenChange={setMobileTreeOpen}>
          <SheetContent side="left" className="p-0 w-[300px] sm:w-[320px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Documents</SheetTitle>
            </SheetHeader>
            <div className="h-full">{treePanel}</div>
          </SheetContent>
        </Sheet>
      )}

      {/* Center editor */}
      <main className="flex-1 min-w-0 flex flex-col bg-white">
        <EditorHeader
          workspaceId={workspaceId}
          document={mergedDoc}
          presence={MOCK_PRESENCE}
          canLock={canLock}
          canDelete={canDelete}
          onToggleLock={handleToggleLock}
          onDelete={handleDelete}
          onToggleTree={() => setMobileTreeOpen(true)}
          onToggleFocusMode={() => setFocusMode((f) => !f)}
          focusMode={focusMode}
          onToggleComments={() => {
            if (isMobile) {
              setMobileCommentsOpen((v) => !v);
            } else {
              setCommentsOpen((v) => !v);
            }
          }}
          commentsOpen={isMobile ? mobileCommentsOpen : commentsOpen}
          openCommentCount={openCount}
          submitSlot={submitButton}
        />
        {/* Supervisor review panel — top priority when present */}
        {showReviewPanel && pendingSubmission && (
          <EditorReviewPanel
            pendingSubmission={pendingSubmission}
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
          />
        )}
        {/* Student feedback banner for changes_requested */}
        {showFeedbackBanner && lastChangesRequested && (
          <EditorReviewFeedback
            lastDecision={lastChangesRequested}
            canResubmit={canSubmitForReview}
            onResubmit={() => setSubmitDialogOpen(true)}
          />
        )}
        {/* Other read-only reasons (locked / approved / archived / viewer) — hide if review panel already explains it */}
        {readOnlyReason && !showReviewPanel && !showFeedbackBanner && (
          <EditorReadOnlyBanner
            reason={readOnlyReason}
            lockedByName={mergedDoc.lockedBy?.fullName}
          />
        )}
        {/* Submission history rail */}
        {showSubmissionHistory && (
          <EditorSubmissionHistory history={submissionHistory} />
        )}
        <EditorToolbar editor={editor} isReadOnly={!isEditable} />
        <EditorContentArea ref={editorScrollRef} editor={editor} />
        {isEditable && <EditorSlashCommand editor={editor} />}
        <EditorStatusBar
          editor={editor}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          connectionStatus={connectionStatus}
          collaboratorCount={MOCK_PRESENCE.length}
        />
      </main>

      {/* Floating selection-based comment trigger */}
      <DocumentInlineCommentTrigger
        editor={editor}
        enabled={!!editor && !pendingAnchor && !pendingTaskSnippet}
        onComment={handleStartAnchoredComment}
        onCreateTask={
          canComment ? (snippet) => setPendingTaskSnippet(snippet) : undefined
        }
      />

      {/* Desktop comments rail */}
      <div
        className={cn(
          "hidden xl:flex flex-shrink-0 transition-[width] duration-300 ease-out overflow-hidden",
          showDesktopComments ? "w-[360px]" : "w-0",
        )}
        aria-hidden={!showDesktopComments}
      >
        <div className="w-[360px] h-full">
          <DocumentCommentsRail
            threads={visibleThreads}
            filter={filter}
            openCount={openCount}
            resolvedCount={resolvedCount}
            activeThreadId={activeThreadId}
            canComment={canComment}
            canResolve={canResolveThreads}
            onFilterChange={setFilter}
            onCreate={handleCreateGeneralComment}
            onReply={handleReply}
            onToggleResolve={handleToggleResolve}
            onSelectThread={focusThread}
            onJumpToAnchor={handleJumpToAnchor}
          />
        </div>
      </div>

      {/* Mobile/tablet comments drawer (right side) */}
      <Sheet open={mobileCommentsOpen} onOpenChange={setMobileCommentsOpen}>
        <SheetContent side="right" className="p-0 w-[340px] sm:w-[400px] xl:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          <div className="h-full">
            <DocumentCommentsRail
              threads={visibleThreads}
              filter={filter}
              openCount={openCount}
              resolvedCount={resolvedCount}
              activeThreadId={activeThreadId}
              canComment={canComment}
              canResolve={canResolveThreads}
              onFilterChange={setFilter}
              onCreate={handleCreateGeneralComment}
              onReply={handleReply}
              onToggleResolve={handleToggleResolve}
              onSelectThread={focusThread}
              onJumpToAnchor={(id) => {
                handleJumpToAnchor(id);
                setMobileCommentsOpen(false);
              }}
              onClose={() => setMobileCommentsOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Anchored comment dialog: prompts the user to confirm + write the thread */}
      <Dialog open={pendingAnchor !== null} onOpenChange={(o) => !o && setPendingAnchor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Comment on selection</DialogTitle>
          </DialogHeader>
          {pendingAnchor && (
            <>
              <div className="px-3 py-2 rounded-md bg-stone-50 border-l-2 border-teal-400 text-[13px] text-stone-700 leading-snug max-h-32 overflow-y-auto">
                <span className="opacity-60">"</span>
                {pendingAnchor}
                <span className="opacity-60">"</span>
              </div>
              <DocumentCommentComposer
                placeholder="Add your comment… use @ to mention"
                submitLabel="Add comment"
                autoFocus
                onSubmit={handleSubmitAnchoredComment}
                onCancel={() => setPendingAnchor(null)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {createDocOpen && (
        <TreeCreateDialog
          open
          kind="document"
          folderName={null}
          onClose={() => setCreateDocOpen(false)}
          onCreated={handleCreateDoc}
        />
      )}
      {createFolderOpen && (
        <TreeCreateDialog
          open
          kind="folder"
          parentName={null}
          onClose={() => setCreateFolderOpen(false)}
          onCreated={handleCreateFolder}
        />
      )}

      {/* Academic submit-for-review dialog */}
      {academicEnabled && (
        <EditorSubmitDialog
          open={submitDialogOpen}
          onOpenChange={setSubmitDialogOpen}
          documentTitle={mergedDoc.title}
          isResubmission={isResubmission}
          canSubmit={docHasContent}
          blockReason={
            !docHasContent
              ? "This document is empty. Add some content before submitting."
              : undefined
          }
          onConfirm={handleConfirmSubmit}
        />
      )}

      {/* Create-task-from-selection dialog */}
      {pendingTaskSnippet && (
        <CreateTaskDialog
          workspaceId={workspaceId}
          presetStatus="todo"
          members={workspaceMembers}
          assignableMembers={
            ["OWNER", "ADMIN", "MANAGER"].includes(workspace.myRole)
              ? workspaceMembers
              : workspaceMembers.filter((m) => m.id === CURRENT_USER_ID)
          }
          currentUserId={CURRENT_USER_ID}
          sourceLink={{
            documentId: mergedDoc.id,
            documentTitle: mergedDoc.title,
            documentIcon: "📄",
            anchor: { snippet: pendingTaskSnippet, status: "ok" },
          }}
          onClose={() => setPendingTaskSnippet(null)}
          onCreated={handleCreateTaskFromSelection}
        />
      )}
    </div>
  );
};

export default DocumentEditorPage;
