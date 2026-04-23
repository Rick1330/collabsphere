/**
 * EditorSlashCommand
 *
 * A lightweight TipTap "slash command" menu — the canonical block-insert UX
 * (Notion / Linear / Slack). When the user types `/` at the start of a line
 * (or after whitespace), we open a floating menu of block actions anchored
 * to the caret. Selecting an item:
 *   - Removes the trigger character + any typed query.
 *   - Applies the corresponding TipTap command.
 *
 * Critical: we never preventDefault on the `/` keystroke. The character is
 * inserted normally so the user always sees what they typed; the menu is
 * purely additive. Escape, blur, click-outside, or moving the caret away
 * all dismiss the menu without disturbing the document.
 *
 * Anchoring uses TipTap's `view.coordsAtPos(from)` for sub-pixel-correct
 * placement — no DOM scraping required.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Type,
} from "lucide-react";

interface EditorSlashCommandProps {
  editor: Editor | null;
  /** Optional offset (px) added to the caret coordinates — useful when the
   * editor lives inside a scrollable viewport. */
  scrollContainer?: HTMLElement | null;
}

interface SlashItem {
  id: string;
  label: string;
  hint: string;
  Icon: typeof Heading1;
  /** Keywords used for filtering once a query is typed. */
  keywords: string[];
  run: (editor: Editor) => void;
}

const ITEMS: SlashItem[] = [
  {
    id: "h1",
    label: "Heading 1",
    hint: "Section title",
    Icon: Heading1,
    keywords: ["h1", "heading", "title"],
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    label: "Heading 2",
    hint: "Sub-section",
    Icon: Heading2,
    keywords: ["h2", "heading", "subtitle"],
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "Heading 3",
    hint: "Inline header",
    Icon: Heading3,
    keywords: ["h3", "heading"],
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "p",
    label: "Paragraph",
    hint: "Plain text",
    Icon: Type,
    keywords: ["paragraph", "text", "body"],
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: "ul",
    label: "Bullet list",
    hint: "Unordered list",
    Icon: List,
    keywords: ["bullet", "list", "ul"],
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "ol",
    label: "Numbered list",
    hint: "Ordered list",
    Icon: ListOrdered,
    keywords: ["numbered", "list", "ol", "ordered"],
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "task",
    label: "To-do list",
    hint: "Checkboxes",
    Icon: ListChecks,
    keywords: ["task", "todo", "checkbox"],
    run: (e) => {
      // StarterKit doesn't ship with task list — fall back to bullet list
      // so the action always succeeds gracefully.
      e.chain().focus().toggleBulletList().run();
    },
  },
  {
    id: "quote",
    label: "Quote",
    hint: "Block quote",
    Icon: Quote,
    keywords: ["quote", "blockquote"],
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code",
    label: "Code block",
    hint: "Fenced code",
    Icon: Code2,
    keywords: ["code", "pre"],
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "hr",
    label: "Divider",
    hint: "Horizontal rule",
    Icon: Minus,
    keywords: ["divider", "hr", "rule", "separator"],
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
];

interface MenuState {
  /** Document position of the trigger `/`. */
  triggerPos: number;
  /** Caret screen coordinates at trigger time. */
  top: number;
  left: number;
  /** Filtering query typed after `/`. */
  query: string;
}

export const EditorSlashCommand = ({ editor }: EditorSlashCommandProps) => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Live-region message — screen readers announce the open state and the
  // currently highlighted item. Kept at the component root so the same node
  // is reused (cheaper for AT than swapping content between regions).
  const [liveMessage, setLiveMessage] = useState("");

  // Filtered list — keep order stable to make muscle memory work.
  const filtered = useMemo(() => {
    if (!menu) return ITEMS;
    const q = menu.query.toLowerCase().trim();
    if (!q) return ITEMS;
    return ITEMS.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.keywords.some((k) => k.includes(q)),
    );
  }, [menu]);

  // Reset highlighted item when filter changes.
  useEffect(() => {
    setActiveIdx(0);
  }, [menu?.query, filtered.length]);

  // Roving tabindex: move DOM focus onto the active option whenever the
  // selection changes. This keeps screen reader announcements in sync with
  // visual highlight and makes the menu fully keyboard-operable.
  useEffect(() => {
    if (!menu) return;
    const node = itemRefs.current[activeIdx];
    if (node) {
      node.focus({ preventScroll: true });
      node.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx, menu]);

  // Announce open / filter / highlight changes to assistive tech.
  useEffect(() => {
    if (!menu) {
      setLiveMessage("");
      return;
    }
    const item = filtered[activeIdx];
    if (filtered.length === 0) {
      setLiveMessage(`No matches for "${menu.query}"`);
      return;
    }
    const prefix = menu.query
      ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for "${menu.query}".`
      : `Insert block menu open with ${filtered.length} options.`;
    setLiveMessage(item ? `${prefix} ${item.label} highlighted.` : prefix);
  }, [menu, filtered, activeIdx]);

  // Track editor updates: open on `/`, update query, close on conditions.
  useEffect(() => {
    if (!editor) return;

    const computeCoords = (pos: number) => {
      try {
        const { top, left } = editor.view.coordsAtPos(pos);
        return { top, left };
      } catch {
        return { top: 0, left: 0 };
      }
    };

    const onUpdate = () => {
      const { state } = editor;
      const { from } = state.selection;
      // Look at the text in the current text block, up to the caret.
      const $from = state.selection.$from;
      const blockStart = $from.before($from.depth) + 1;
      const textBefore = state.doc.textBetween(blockStart, from, "\n", "\n");

      // Find the trigger `/` — the last `/` preceded by start-of-block or
      // whitespace, with no whitespace between it and the caret.
      const match = textBefore.match(/(?:^|\s)(\/[^\s]*)$/);
      if (!match) {
        if (menu) setMenu(null);
        return;
      }
      const fragment = match[1]; // includes the leading `/`
      const triggerPos = from - fragment.length;
      const query = fragment.slice(1);
      const { top, left } = computeCoords(triggerPos);
      setMenu({ triggerPos, top, left, query });
    };

    const onSelectionUpdate = onUpdate;
    const onBlur = () => setMenu(null);

    editor.on("update", onUpdate);
    editor.on("selectionUpdate", onSelectionUpdate);
    editor.on("blur", onBlur);
    return () => {
      editor.off("update", onUpdate);
      editor.off("selectionUpdate", onSelectionUpdate);
      editor.off("blur", onBlur);
    };
    // We intentionally read `menu` via closure for the early-return only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Capture-phase keydown so we can consume Enter/Tab/Arrow/Escape *before*
  // TipTap. We never consume `/` itself — that always types as normal.
  useEffect(() => {
    if (!editor || !menu) return;
    const dom = editor.view.dom as HTMLElement;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenu(null);
        return;
      }
      if (filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyItem(filtered[activeIdx]);
      }
    };

    dom.addEventListener("keydown", handler, true);
    return () => dom.removeEventListener("keydown", handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, menu, filtered, activeIdx]);

  const applyItem = (item: SlashItem | undefined) => {
    if (!editor || !menu || !item) return;
    const { triggerPos, query } = menu;
    // Remove the `/` + typed query before applying the block transform so
    // we don't leave litter behind.
    editor
      .chain()
      .focus()
      .deleteRange({ from: triggerPos, to: triggerPos + 1 + query.length })
      .run();
    item.run(editor);
    setMenu(null);
  };

  if (!menu || !editor) return null;

  // Constrain the popover within the viewport — flip above when needed.
  const ROW_HEIGHT = 36;
  const PADDING = 12;
  const estHeight =
    Math.min(filtered.length, 6) * ROW_HEIGHT + 24 || 60;
  const wouldOverflow = menu.top + estHeight + PADDING > window.innerHeight;
  const top = wouldOverflow ? menu.top - estHeight - 6 : menu.top + 22;

  const activeId = filtered[activeIdx]
    ? `slash-cmd-option-${filtered[activeIdx].id}`
    : undefined;

  return (
    <>
      {/* Polite live region — kept off-screen but readable by AT. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
      <div
        ref={menuRef}
        role="listbox"
        aria-label="Insert block"
        aria-activedescendant={activeId}
        data-testid="slash-command-menu"
        className="fixed z-50 w-64 rounded-lg border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        style={{ top, left: menu.left }}
        onMouseDown={(e) => e.preventDefault()} // keep editor focus
      >
        <div className="px-2.5 py-1.5 border-b border-border bg-muted/40">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            {menu.query ? `"${menu.query}"` : "Insert block"}
          </span>
        </div>
        <ul className="max-h-[240px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-[12px] text-muted-foreground italic">
              No matches. Press Esc to dismiss.
            </li>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === activeIdx;
              const Icon = item.Icon;
              return (
                <li key={item.id}>
                  <button
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    id={`slash-cmd-option-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    // Roving tabindex: only the active option is reachable
                    // by Tab; the rest are -1 so ArrowUp/Down owns navigation.
                    tabIndex={active ? 0 : -1}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => applyItem(item)}
                    className={
                      "w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors " +
                      (active
                        ? "bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100"
                        : "text-foreground hover:bg-muted")
                    }
                  >
                    <span
                      className={
                        "h-7 w-7 rounded-md border flex items-center justify-center shrink-0 " +
                        (active
                          ? "border-teal-200 dark:border-teal-800 bg-card"
                          : "border-border bg-card")
                      }
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate leading-tight">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight">
                        {item.hint}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="px-2.5 py-1.5 border-t border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground tracking-wider">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Test-only exports                                                   */
/* ------------------------------------------------------------------ */

/**
 * Pure helpers exposed for unit testing without instantiating TipTap.
 *
 * `detectTrigger` mirrors the regex used by the live editor listener: it
 * returns a `{ query, triggerOffset }` tuple when the text-before-caret
 * ends with a slash trigger, and `null` otherwise.
 *
 * `filterItems` runs the same label + keyword match as the rendered list
 * so tests can assert filtering behavior on the canonical item set.
 */
export const __slashTestables = {
  ITEMS,
  detectTrigger(textBefore: string): { query: string; triggerOffset: number } | null {
    const match = textBefore.match(/(?:^|\s)(\/[^\s]*)$/);
    if (!match) return null;
    const fragment = match[1];
    return {
      query: fragment.slice(1),
      triggerOffset: textBefore.length - fragment.length,
    };
  },
  filterItems(query: string): SlashItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return ITEMS;
    return ITEMS.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.keywords.some((k) => k.includes(q)),
    );
  },
};
