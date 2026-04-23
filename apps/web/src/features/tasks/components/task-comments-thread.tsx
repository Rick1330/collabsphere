import { useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials, relativeTime } from "@/lib/format";
import type { CommentNode } from "@/lib/mock-comments";
import type { TaskAssignee, TaskComment } from "@/api/adapters/tasks";
import { TaskCommentComposer } from "./task-comment-composer";

interface Props {
  comments: TaskComment[];
  members: TaskAssignee[];
  currentUserId: string;
  canComment: boolean;
  onAdd: (body: CommentNode[]) => void;
  onEdit: (id: string, body: CommentNode[]) => void;
  onDelete: (id: string) => void;
}

/** Editorial review-style comment thread. Oldest → newest. */
export const TaskCommentsThread = ({
  comments,
  members,
  currentUserId,
  canComment,
  onAdd,
  onEdit,
  onDelete,
}: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const currentUser =
    members.find((m) => m.id === currentUserId) ?? members[0];

  const findMember = (id: string) =>
    members.find((m) => m.id === id) ?? {
      id,
      fullName: "Unknown",
      avatarUrl: null,
    };

  const sorted = [...comments].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="space-y-4">
      {sorted.length === 0 ? (
        <div className="text-[12px] text-stone-400 italic px-1">
          No comments yet. Start the discussion below.
        </div>
      ) : (
        <ol className="space-y-3" aria-label="Comments">
          {sorted.map((c) => {
            const author = findMember(c.authorId);
            const isMine = c.authorId === currentUserId;
            const isEditing = editingId === c.id;
            return (
              <li
                key={c.id}
                className="flex gap-2.5 group"
                aria-label={`Comment by ${author.fullName}`}
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: getAvatarColor(author.id) }}
                >
                  {getInitials(author.fullName, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-stone-900">
                      {author.fullName}
                    </span>
                    <time
                      dateTime={c.createdAt}
                      className="font-mono text-[10px] text-stone-400 tracking-wider uppercase"
                    >
                      {relativeTime(c.createdAt)}
                      {c.updatedAt && c.updatedAt !== c.createdAt && (
                        <span className="ml-1">· edited</span>
                      )}
                    </time>
                    {isMine && !isEditing && (
                      <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(c.id)}
                          className="h-6 w-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          aria-label="Edit comment"
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Delete this comment?"))
                              onDelete(c.id);
                          }}
                          className="h-6 w-6 rounded-md flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete comment"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <InlineEditor
                      initial={c.body}
                      members={members}
                      onCancel={() => setEditingId(null)}
                      onSave={(body) => {
                        onEdit(c.id, body);
                        setEditingId(null);
                      }}
                    />
                  ) : (
                    <div className="text-[13px] text-stone-700 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                      {c.body.map((node, i) => renderNode(node, i))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {canComment && (
        <TaskCommentComposer
          members={members}
          currentUser={currentUser}
          onSubmit={onAdd}
        />
      )}
    </div>
  );
};

function renderNode(node: CommentNode, key: number) {
  if (node.type === "mention") {
    return (
      <span
        key={key}
        className={cn(
          "inline px-1 rounded bg-teal-50 text-teal-700 font-medium",
        )}
      >
        @{node.display}
      </span>
    );
  }
  return <span key={key}>{node.text}</span>;
}

function bodyToText(body: CommentNode[]): string {
  return body
    .map((n) => (n.type === "mention" ? `@${n.display}` : n.text))
    .join("");
}

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
      const remainder = raw.slice(i + 1);
      const match = members
        .map((m) => m.fullName)
        .sort((a, b) => b.length - a.length)
        .find((name) => remainder.toLowerCase().startsWith(name.toLowerCase()));
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

const InlineEditor = ({
  initial,
  members,
  onCancel,
  onSave,
}: {
  initial: CommentNode[];
  members: TaskAssignee[];
  onCancel: () => void;
  onSave: (body: CommentNode[]) => void;
}) => {
  const [value, setValue] = useState(bodyToText(initial));
  return (
    <div className="mt-1 rounded-md border border-stone-200 bg-white focus-within:border-teal-500/40 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        autoFocus
        className="w-full resize-none bg-transparent text-[13px] text-stone-900 px-2.5 py-2 focus:outline-none leading-relaxed"
      />
      <div className="flex items-center justify-end gap-1 px-2 py-1.5 border-t border-stone-100">
        <button
          type="button"
          onClick={onCancel}
          className="h-6 px-2 rounded text-[11px] font-medium text-stone-500 hover:bg-stone-50 transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
        <button
          type="button"
          disabled={!value.trim()}
          onClick={() => onSave(parseBody(value, members))}
          className="h-6 px-2 rounded text-[11px] font-medium bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          <Check className="h-3 w-3" /> Save
        </button>
      </div>
    </div>
  );
};
