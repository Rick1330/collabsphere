/**
 * Central shortcut registry.
 *
 * This is the single source of truth for the in-app keyboard model. The
 * shell wires the global ones, the help dialog renders this list, and the
 * command palette surfaces a "Keyboard shortcuts" entry that opens the help
 * dialog from this same data.
 *
 * Keep the list intentionally small. Every entry should pull its weight.
 */

export interface ShortcutDef {
  /** Stable identifier — used in tests and palette wiring. */
  id: string;
  /** Display keys, in order. e.g. ["⌘", "K"] or ["G", "D"]. */
  keys: string[];
  /** Short description shown in help and palette. */
  label: string;
  /** Group heading in the help dialog. */
  group: "Global" | "Navigation" | "Documents" | "Tasks" | "Review";
  /** Optional context note shown in the help dialog. */
  hint?: string;
}

export const SHORTCUTS: ShortcutDef[] = [
  // Global
  { id: "palette", keys: ["⌘", "K"], label: "Open command palette", group: "Global" },
  { id: "sidebar", keys: ["⌘", "B"], label: "Toggle sidebar", group: "Global" },
  { id: "help", keys: ["?"], label: "Show keyboard shortcuts", group: "Global" },

  // Navigation (g + key sequences)
  { id: "go-dashboard", keys: ["G", "D"], label: "Go to dashboard", group: "Navigation" },
  { id: "go-workspaces", keys: ["G", "W"], label: "Go to workspaces", group: "Navigation" },
  { id: "go-notifications", keys: ["G", "N"], label: "Go to notifications", group: "Navigation" },
  { id: "go-review", keys: ["G", "R"], label: "Go to review queue", group: "Navigation", hint: "Reviewers and admins only" },
  { id: "go-settings", keys: ["G", "S"], label: "Go to settings", group: "Navigation" },
  { id: "new-doc", keys: ["G", "C"], label: "Create new document", group: "Navigation", hint: "In the current workspace — falls back to the workspace picker" },

  // Documents
  { id: "doc-save", keys: ["⌘", "S"], label: "Save document", group: "Documents", hint: "Inside the editor" },
  { id: "doc-focus", keys: ["⌘", "⇧", "E"], label: "Toggle focus mode", group: "Documents", hint: "Inside the editor" },
  { id: "doc-comment-submit", keys: ["⌘", "↵"], label: "Send comment", group: "Documents", hint: "Inside a comment composer" },

  // Tasks
  { id: "task-search", keys: ["/"], label: "Focus task search", group: "Tasks" },
  { id: "task-new", keys: ["N"], label: "Create new task", group: "Tasks", hint: "When you have create permission" },
  { id: "task-view-board", keys: ["V", "B"], label: "Switch to board view", group: "Tasks" },
  { id: "task-view-list", keys: ["V", "L"], label: "Switch to list view", group: "Tasks" },

  // Review
  { id: "review-search", keys: ["/"], label: "Focus review search", group: "Review" },
  { id: "review-next", keys: ["J"], label: "Move to next submission", group: "Review" },
  { id: "review-prev", keys: ["K"], label: "Move to previous submission", group: "Review" },
  { id: "review-approve", keys: ["A"], label: "Approve focused submission", group: "Review" },
  { id: "review-changes", keys: ["R"], label: "Request changes on focused submission", group: "Review" },
];

export function shortcutsByGroup() {
  const groups: Record<string, ShortcutDef[]> = {};
  for (const s of SHORTCUTS) {
    (groups[s.group] ||= []).push(s);
  }
  return groups;
}
