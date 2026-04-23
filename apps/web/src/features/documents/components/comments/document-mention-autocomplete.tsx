import { useEffect, useMemo, useRef, useState } from "react";
import { getInitials } from "@/lib/format";
import { WORKSPACE_MEMBERS, type WorkspaceMember } from "@/lib/mock-comments";
import { cn } from "@/lib/utils";

interface DocumentMentionAutocompleteProps {
  query: string;
  onSelect: (member: WorkspaceMember) => void;
  onClose: () => void;
  /** Element to anchor positioning under; if null we render statically below caret */
  anchorRect?: DOMRect | null;
}

/**
 * Workspace-member typeahead. Renders as a small floating panel just under the
 * caret/composer input. Keyboard-controlled by parent via the `register` API:
 * the parent passes keydown events to `onKeyDown` and we intercept arrows/enter.
 */
export const DocumentMentionAutocomplete = ({
  query,
  onSelect,
  onClose,
  anchorRect,
}: DocumentMentionAutocompleteProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = WORKSPACE_MEMBERS.filter((m) => m.role !== "VIEWER");
    if (!q) return all.slice(0, 6);
    return all
      .filter((m) => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query]);

  useEffect(() => setActiveIndex(0), [query]);

  // Bubble keyboard events from window so the parent input remains focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (matches.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % matches.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSelect(matches[activeIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [matches, activeIndex, onSelect, onClose]);

  if (matches.length === 0) {
    return (
      <div
        role="listbox"
        aria-label="Mention workspace member"
        className="absolute z-50 mt-1 w-64 rounded-lg border border-stone-200 bg-white shadow-lg p-3 text-xs text-stone-500"
        style={anchorRect ? { top: anchorRect.bottom + 4, left: anchorRect.left } : undefined}
      >
        No workspace members match "{query}"
      </div>
    );
  }

  return (
    <div
      className="absolute z-50 mt-1 w-72 rounded-lg border border-stone-200 bg-white shadow-lg overflow-hidden"
      style={anchorRect ? { position: "fixed", top: anchorRect.bottom + 4, left: anchorRect.left } : undefined}
    >
      <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] font-mono tracking-wider text-stone-400 uppercase">
        Mention member
      </div>
      <ul ref={listRef} role="listbox" aria-label="Workspace members">
        {matches.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(m);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                i === activeIndex ? "bg-teal-50" : "hover:bg-stone-50",
              )}
            >
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: m.color }}
              >
                {getInitials(m.fullName, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-stone-900 font-medium truncate">{m.fullName}</div>
                <div className="text-[11px] text-stone-400 truncate">{m.email}</div>
              </div>
              <span className="text-[9px] font-mono tracking-wider text-stone-400 uppercase">
                {m.role}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
