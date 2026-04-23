import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ListPlus, MessageSquarePlus } from "lucide-react";

interface InlineCommentTriggerProps {
  editor: Editor | null;
  enabled: boolean;
  /** Called with the selected snippet to start a new anchored thread */
  onComment: (snippet: string) => void;
  /** Optional: also offer "Create task" from selection */
  onCreateTask?: (snippet: string) => void;
}

interface BubbleState {
  visible: boolean;
  top: number;
  left: number;
  snippet: string;
}

const MIN_SELECTION_LENGTH = 2;

/**
 * Floating affordance shown above a non-empty editor selection. Offers
 * inline anchored comments and (optionally) creating a task from selection.
 */
export const DocumentInlineCommentTrigger = ({
  editor,
  enabled,
  onComment,
  onCreateTask,
}: InlineCommentTriggerProps) => {
  const [bubble, setBubble] = useState<BubbleState>({
    visible: false,
    top: 0,
    left: 0,
    snippet: "",
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor || !enabled) {
      setBubble((b) => ({ ...b, visible: false }));
      return;
    }

    const update = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setBubble((b) => ({ ...b, visible: false }));
        return;
      }
      const range = sel.getRangeAt(0);
      const text = sel.toString();
      if (!text || text.trim().length < MIN_SELECTION_LENGTH) {
        setBubble((b) => ({ ...b, visible: false }));
        return;
      }
      const editorEl = editor.view.dom;
      if (!editorEl.contains(range.commonAncestorContainer)) {
        setBubble((b) => ({ ...b, visible: false }));
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setBubble((b) => ({ ...b, visible: false }));
        return;
      }
      setBubble({
        visible: true,
        top: rect.top + window.scrollY - 40,
        left: rect.left + rect.width / 2 + window.scrollX,
        snippet: text.trim().slice(0, 200),
      });
    };

    const onSelectionChange = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", onSelectionChange, true);
    window.addEventListener("resize", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", onSelectionChange, true);
      window.removeEventListener("resize", onSelectionChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [editor, enabled]);

  if (!bubble.visible) return null;

  return (
    <div
      role="toolbar"
      aria-label="Selection actions"
      className="fixed z-40 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-100 flex items-center gap-1 rounded-lg bg-stone-900 text-white shadow-lg p-1"
      style={{ top: bubble.top, left: bubble.left }}
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onComment(bubble.snippet);
        }}
        className="h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:bg-stone-700 transition-colors"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
        Comment
      </button>
      {onCreateTask && (
        <>
          <span className="w-px h-4 bg-stone-700" aria-hidden="true" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onCreateTask(bubble.snippet);
            }}
            className="h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 hover:bg-stone-700 transition-colors"
            title="Create task from selection"
          >
            <ListPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Task
          </button>
        </>
      )}
    </div>
  );
};
