import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentNode } from "@/lib/mock-comments";
import { DocumentMentionAutocomplete } from "./document-mention-autocomplete";

interface DocumentCommentComposerProps {
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  onSubmit: (body: CommentNode[]) => void;
  onCancel?: () => void;
}

/**
 * A lightweight contenteditable composer that supports plain text + inline
 * mention chips. Mentions are stored as React-rendered chips inside the editor
 * div, so on submit we walk the DOM to produce the structured `CommentNode[]`.
 *
 * Why not a heavier editor here? The composer must:
 * - feel snappy and small
 * - never compete visually with the main Tiptap editor
 * - be trivially keyboard-accessible
 */
export const DocumentCommentComposer = ({
  placeholder = "Write a comment… use @ to mention",
  submitLabel = "Comment",
  autoFocus,
  disabled,
  size = "md",
  onSubmit,
  onCancel,
}: DocumentCommentComposerProps) => {
  const editableRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionRect, setMentionRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (autoFocus && editableRef.current) {
      editableRef.current.focus();
    }
  }, [autoFocus]);

  const updateEmpty = useCallback(() => {
    const el = editableRef.current;
    setIsEmpty(!el || (el.textContent ?? "").trim().length === 0);
  }, []);

  /** Detect '@token' immediately preceding the caret to drive the autocomplete */
  const detectMentionTrigger = useCallback(() => {
    const sel = globalThis.getSelection();
    if (!sel || sel.rangeCount === 0 || !editableRef.current?.contains(sel.anchorNode)) {
      setMentionQuery(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      setMentionQuery(null);
      return;
    }
    const text = node.textContent ?? "";
    const upToCaret = text.slice(0, range.startOffset);
    const match = /(^|\s)@([\w.-]*)$/.exec(upToCaret);
    if (!match) {
      setMentionQuery(null);
      return;
    }
    setMentionQuery(match[2]);
    const rect = range.getBoundingClientRect();
    setMentionRect(rect);
  }, []);

  const handleInput = useCallback(() => {
    updateEmpty();
    detectMentionTrigger();
  }, [updateEmpty, detectMentionTrigger]);

  const insertMention = useCallback(
    (member: { id: string; fullName: string; color: string }) => {
      const sel = globalThis.getSelection();
      if (!sel || sel.rangeCount === 0 || !editableRef.current) return;
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return;
      const text = node.textContent ?? "";
      const upToCaret = text.slice(0, range.startOffset);
      const match = /(^|\s)@([\w.-]*)$/.exec(upToCaret);
      if (!match) return;

      const startOffset = match.index + match[1].length; // position of '@'
      // Replace text [startOffset, caret] with mention chip + trailing space
      const before = text.slice(0, startOffset);
      const after = text.slice(range.startOffset);

      const textNode = node as Text;
      textNode.textContent = before;

      const chip = document.createElement("span");
      chip.contentEditable = "false";
      chip.setAttribute("data-mention-id", member.id);
      chip.setAttribute("data-mention-name", member.fullName);
      chip.className =
        "inline-flex items-center px-1.5 py-px rounded bg-teal-50 text-teal-700 font-medium text-[13px] mx-px select-none";
      chip.textContent = `@${member.fullName.split(" ")[0]}`;

      const space = document.createTextNode(after.length === 0 || !after.startsWith(" ") ? " " + after : after);

      const parent = textNode.parentNode!;
      const nextSibling = textNode.nextSibling;
      parent.insertBefore(chip, nextSibling);
      parent.insertBefore(space, chip.nextSibling);

      // Place caret right after the inserted space character
      const newRange = document.createRange();
      newRange.setStart(space, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      setMentionQuery(null);
      updateEmpty();
    },
    [updateEmpty],
  );

  const serialize = useCallback((): CommentNode[] => {
    const el = editableRef.current;
    if (!el) return [];
    const out: CommentNode[] = [];
    const walk = (n: ChildNode) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const text = n.textContent ?? "";
        if (text) {
          const last = out[out.length - 1];
          if (last && last.type === "text") last.text += text;
          else out.push({ type: "text", text });
        }
        return;
      }
      if (n.nodeType === Node.ELEMENT_NODE) {
        const elNode = n as HTMLElement;
        const id = elNode.getAttribute("data-mention-id");
        if (id) {
          out.push({
            type: "mention",
            userId: id,
            display: elNode.getAttribute("data-mention-name") ?? elNode.textContent ?? "",
          });
          return;
        }
        if (elNode.tagName === "BR") {
          const last = out[out.length - 1];
          if (last && last.type === "text") last.text += "\n";
          else out.push({ type: "text", text: "\n" });
          return;
        }
        n.childNodes.forEach(walk);
      }
    };
    el.childNodes.forEach(walk);
    // collapse to nothing if only whitespace
    if (out.every((n) => n.type === "text" && !n.text.trim())) return [];
    return out;
  }, []);

  const handleSubmit = useCallback(() => {
    if (disabled || isEmpty) return;
    const body = serialize();
    if (body.length === 0) return;
    onSubmit(body);
    if (editableRef.current) editableRef.current.innerHTML = "";
    setIsEmpty(true);
    setMentionQuery(null);
  }, [disabled, isEmpty, serialize, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Mention navigation is handled by the autocomplete via window listener
    if (mentionQuery !== null && ["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(e.key)) {
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "rounded-lg border bg-white transition-colors",
          disabled
            ? "border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed"
            : "border-stone-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/10",
        )}
      >
        <div className="relative">
          <div
            ref={editableRef}
            contentEditable={!disabled}
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            spellCheck
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={detectMentionTrigger}
            onMouseUp={detectMentionTrigger}
            tabIndex={disabled ? -1 : 0}
            onBlur={() => globalThis.setTimeout(() => setMentionQuery(null), 120)}
            className={cn(
              "w-full outline-none text-sm text-stone-800 leading-relaxed",
              size === "sm" ? "px-3 py-2 min-h-[60px]" : "px-3 py-2.5 min-h-[72px]",
            )}
            suppressContentEditableWarning
          />
          {isEmpty && (
            <div
              aria-hidden="true"
              className={cn(
                "absolute top-0 left-0 pointer-events-none text-sm text-stone-400 italic",
                size === "sm" ? "px-3 py-2" : "px-3 py-2.5",
              )}
            >
              {placeholder}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-t border-stone-100">
          <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase pl-1">
            ⌘↵ to send · @ to mention
          </span>
          <div className="flex items-center gap-1">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="h-7 px-2.5 rounded-md text-xs font-medium text-stone-500 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || isEmpty}
              className={cn(
                "h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors",
                disabled || isEmpty
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "bg-teal-600 text-white hover:bg-teal-500",
              )}
            >
              <Send className="h-3 w-3" aria-hidden="true" />
              {submitLabel}
            </button>
          </div>
        </div>
      </div>

      {mentionQuery !== null && (
        <DocumentMentionAutocomplete
          query={mentionQuery}
          anchorRect={mentionRect}
          onSelect={insertMention}
          onClose={() => setMentionQuery(null)}
        />
      )}
    </div>
  );
};
