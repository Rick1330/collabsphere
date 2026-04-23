import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/format";
import type { CommentNode } from "@/lib/mock-comments";
import type { TaskAssignee } from "@/api/adapters/tasks";
import { TaskMentionAutocomplete } from "./task-mention-autocomplete";

interface Props {
  members: TaskAssignee[];
  currentUser: TaskAssignee;
  onSubmit: (body: CommentNode[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

/**
 * Parse a plain text composer string into structured CommentNodes by
 * detecting `@Name` runs against the workspace member list.
 */
function parseBody(raw: string, members: TaskAssignee[]): CommentNode[] {
  const nodes: CommentNode[] = [];
  let i = 0;
  let buffer = "";
  const pushText = () => {
    if (buffer) {
      nodes.push({ type: "text", text: buffer });
      buffer = "";
    }
  };

  while (i < raw.length) {
    if (raw[i] === "@") {
      // Try to match the longest member name starting here
      const remainder = raw.slice(i + 1);
      const match = members
        .map((m) => m.fullName)
        .sort((a, b) => b.length - a.length)
        .find((name) =>
          remainder.toLowerCase().startsWith(name.toLowerCase()),
        );
      if (match) {
        const member = members.find(
          (m) => m.fullName.toLowerCase() === match.toLowerCase(),
        )!;
        pushText();
        nodes.push({ type: "mention", userId: member.id, display: member.fullName });
        i += 1 + match.length;
        continue;
      }
    }
    buffer += raw[i];
    i++;
  }
  pushText();
  return nodes;
}

export const TaskCommentComposer = ({
  members,
  currentUser,
  onSubmit,
  placeholder = "Add a comment… use @ to mention",
  autoFocus,
  compact,
}: Props) => {
  const [value, setValue] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValue(v);
    // Detect "@partial" right before caret
    const caret = e.target.selectionStart ?? v.length;
    const before = v.slice(0, caret);
    const m = before.match(/(?:^|\s)@([\w]*)$/);
    setMentionQuery(m ? m[1] : null);
  };

  const insertMention = (member: TaskAssignee) => {
    const ta = taRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const replaced = before.replace(/(?:^|\s)@([\w]*)$/, (m) => {
      const lead = m.startsWith(" ") ? " " : m.startsWith("\n") ? "\n" : "";
      return `${lead}@${member.fullName} `;
    });
    const next = replaced + after;
    setValue(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = replaced.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(parseBody(value, members));
    setValue("");
    setMentionQuery(null);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null) return; // autocomplete handles keys
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "rounded-lg border border-stone-200 bg-white focus-within:border-teal-500/40 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all",
          compact && "rounded-md",
        )}
      >
        <div className="flex items-start gap-2.5 p-2.5">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
            style={{ backgroundColor: getAvatarColor(currentUser.id) }}
            aria-hidden="true"
          >
            {getInitials(currentUser.fullName, 1)}
          </div>
          <textarea
            ref={taRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={compact ? 1 : 2}
            className="flex-1 resize-none bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none leading-relaxed min-h-[36px]"
            aria-label="Comment text"
          />
        </div>
        <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-stone-100">
          <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase">
            {value.trim() ? `${value.trim().length} char` : "⌘ + ↵ to send"}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            className="h-7 px-2.5 rounded-md bg-teal-600 text-white text-[11px] font-medium hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Send className="h-3 w-3" />
            Comment
          </button>
        </div>
      </div>
      {mentionQuery !== null && (
        <TaskMentionAutocomplete
          query={mentionQuery}
          members={members}
          onSelect={insertMention}
          onClose={() => setMentionQuery(null)}
        />
      )}
    </div>
  );
};
