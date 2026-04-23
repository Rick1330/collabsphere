import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileDown,
  History,
  Lock,
  Maximize2,
  MessageSquare,
  Minimize2,
  MoreHorizontal,
  PanelLeft,
  Trash2,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EditorPresence, type PresenceUser } from "./editor-presence";

export type DocStatus =
  | "draft"
  | "submitted"
  | "changes_requested"
  | "approved"
  | "archived";

export interface EditorDocument {
  id: string;
  title: string;
  status: DocStatus;
  isLocked: boolean;
  lockedBy?: { id: string; fullName: string };
  folderName?: string | null;
}

interface EditorHeaderProps {
  workspaceId: string;
  document: EditorDocument;
  presence: PresenceUser[];
  canLock: boolean;
  canDelete: boolean;
  onToggleLock: () => void;
  onDelete: () => void;
  onToggleTree?: () => void;
  onToggleFocusMode?: () => void;
  focusMode?: boolean;
  onToggleComments?: () => void;
  commentsOpen?: boolean;
  openCommentCount?: number;
  /** Optional slot for academic submit/resubmit action button. */
  submitSlot?: React.ReactNode;
}

export const EditorHeader = ({
  workspaceId,
  document,
  presence,
  canLock,
  canDelete,
  onToggleLock,
  onDelete,
  onToggleTree,
  onToggleFocusMode,
  focusMode = false,
  onToggleComments,
  commentsOpen = false,
  openCommentCount = 0,
  submitSlot,
}: EditorHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-3 h-14 px-3 sm:px-4 border-b border-stone-200 bg-white flex-shrink-0">
      {/* Left: tree toggle + back + breadcrumb + status badges */}
      <div className="flex items-center gap-2 min-w-0">
        {onToggleTree && (
          <button
            type="button"
            onClick={onToggleTree}
            className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-100 flex-shrink-0 lg:hidden"
            aria-label="Toggle document tree"
            title="Toggle document tree"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        <Link
          to={`/w/${workspaceId}/documents`}
          className="hidden lg:flex h-7 w-7 rounded-md items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-100 flex-shrink-0"
          aria-label="Back to documents"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="hidden sm:block h-6 w-px bg-stone-200 mx-0.5" aria-hidden="true" />

        <div className="min-w-0 flex flex-col justify-center">
          <span className="font-mono text-[9px] text-stone-400 tracking-[0.22em] uppercase leading-none mb-1 hidden sm:block">
            Document
          </span>
          <nav aria-label="Document breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-1 text-[13px] min-w-0">
              <li className="hidden md:inline-flex">
                <Link
                  to={`/w/${workspaceId}/documents`}
                  className="text-stone-400 hover:text-stone-700 transition-colors truncate"
                >
                  Documents
                </Link>
              </li>
              {document.folderName && (
                <>
                  <li aria-hidden="true" className="hidden md:inline-flex">
                    <ChevronRight className="h-3 w-3 text-stone-300" />
                  </li>
                  <li className="text-stone-400 truncate hidden md:inline">
                    {document.folderName}
                  </li>
                </>
              )}
              <li aria-hidden="true" className="hidden md:inline-flex">
                <ChevronRight className="h-3 w-3 text-stone-300" />
              </li>
              <li
                aria-current="page"
                className="text-stone-900 font-semibold truncate max-w-[40vw] sm:max-w-[28vw] md:max-w-[24vw] tracking-tight"
              >
                {document.title}
              </li>
            </ol>
          </nav>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          {document.isLocked && (
            <span
              className="flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200"
              title={document.lockedBy ? `Locked by ${document.lockedBy.fullName}` : "Locked"}
            >
              <Lock className="h-3 w-3" />
              LOCKED
            </span>
          )}
          {document.status !== "draft" && (
            <span
              className={cn(
                "text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border",
                document.status === "submitted" &&
                  "bg-amber-50 text-amber-600 border-amber-200",
                document.status === "approved" &&
                  "bg-emerald-50 text-emerald-600 border-emerald-200",
                document.status === "changes_requested" &&
                  "bg-red-50 text-red-600 border-red-200",
                document.status === "archived" &&
                  "bg-stone-100 text-stone-500 border-stone-200",
              )}
            >
              {document.status === "changes_requested"
                ? "CHANGES"
                : document.status.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Right: presence + submit + focus mode + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <EditorPresence users={presence} />

        {submitSlot}

        {onToggleComments && (
          <button
            type="button"
            onClick={onToggleComments}
            className={cn(
              "relative h-7 px-2 rounded-md flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-100",
              commentsOpen
                ? "bg-teal-50 text-teal-700"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-100",
            )}
            aria-label={commentsOpen ? "Hide comments" : "Show comments"}
            title={commentsOpen ? "Hide comments" : "Show comments"}
            aria-pressed={commentsOpen}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Comments</span>
            {openCommentCount > 0 && (
              <span
                className={cn(
                  "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono font-bold flex items-center justify-center",
                  commentsOpen ? "bg-teal-600 text-white" : "bg-stone-200 text-stone-700",
                )}
              >
                {openCommentCount}
              </span>
            )}
          </button>
        )}

        {onToggleFocusMode && (
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="hidden md:flex h-7 w-7 rounded-md items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-100"
            aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
            title={focusMode ? "Exit focus mode (⌘⇧E)" : "Focus mode (⌘⇧E)"}
            aria-pressed={focusMode}
          >
            {focusMode ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-7 w-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-100"
              aria-label="Document actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild className="flex items-center gap-2">
              <Link to={`/w/${workspaceId}/documents/${document.id}/history`}>
                <History className="h-4 w-4 text-stone-500" />
                Version history
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => toast.info("Export coming soon")}
            >
              <Download className="h-4 w-4 text-stone-500" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => toast.info("Export coming soon")}
            >
              <FileDown className="h-4 w-4 text-stone-500" />
              Export as Markdown
            </DropdownMenuItem>
            {canLock && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2" onClick={onToggleLock}>
                  {document.isLocked ? (
                    <>
                      <Unlock className="h-4 w-4 text-stone-500" /> Unlock document
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-stone-500" /> Lock document
                    </>
                  )}
                </DropdownMenuItem>
              </>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete document
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
