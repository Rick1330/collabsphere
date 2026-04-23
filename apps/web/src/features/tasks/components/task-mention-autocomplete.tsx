import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/format";
import type { TaskAssignee } from "@/api/adapters/tasks";

interface Props {
  query: string;
  members: TaskAssignee[];
  onSelect: (member: TaskAssignee) => void;
  onClose: () => void;
}

/**
 * Member autocomplete used by the task comment composer. Anchors itself
 * just under the textarea via parent positioning. Keyboard nav is global
 * so the textarea stays focused while the user picks.
 */
export const TaskMentionAutocomplete = ({
  query,
  members,
  onSelect,
  onClose,
}: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 6);
    return members
      .filter((m) => m.fullName.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, members]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (matches.length === 0) {
        if (e.key === "Escape") onClose();
        return;
      }
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
        aria-label="Mention member"
        className="absolute z-50 mt-1 w-64 rounded-lg border border-stone-200 bg-white shadow-lg p-3 text-xs text-stone-500"
      >
        No members match "{query}"
      </div>
    );
  }

  return (
    <div className="absolute z-50 bottom-full mb-1 left-3 w-64 rounded-lg border border-stone-200 bg-white shadow-lg overflow-hidden">
      <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] font-mono tracking-wider text-stone-400 uppercase">
        Mention member
      </div>
      <ul role="listbox" aria-label="Workspace members">
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
                style={{ backgroundColor: getAvatarColor(m.id) }}
              >
                {getInitials(m.fullName, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-stone-900 font-medium truncate">
                  {m.fullName}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
