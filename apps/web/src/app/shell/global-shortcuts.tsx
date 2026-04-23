/**
 * GlobalShortcuts
 *
 * Mounts the app-wide keyboard shortcut layer once, at the provider root.
 * Every shortcut lives here:
 *   - `⌘K` opens the command palette (via window event so per-page palettes pick it up)
 *   - `?` opens the keyboard-shortcut help dialog
 *   - `g d/w/n/r/s` jump to dashboard / workspaces / notifications / review / settings
 *   - `g c` create a new document in the current workspace (with a fallback
 *     to the workspace picker when no workspace is in the URL)
 *
 * Page-specific shortcuts (`/`, `n`, `j`, `k`, `v b/l`) are wired inside the
 * pages themselves so they only fire in the right context.
 *
 * Auth state is read from the session helper so navigation hotkeys silently
 * no-op for guests, and `g r` only fires for accounts that can review.
 *
 * `⌘K` and `?` deliberately use `allowWhenModalOpen` so the user can always
 * toggle the palette and pop the help sheet — every other global shortcut is
 * suppressed while a dialog or palette is foregrounded so we never steal
 * focus mid-typing.
 */
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useHotkey } from "@/hooks/use-hotkey";
import { useCurrentAccount } from "@/lib/auth-session";
import { getSessionRole } from "@/lib/session-role";
import { emitOpenHelp, emitOpenPalette } from "@/lib/shortcut-events";

/**
 * Pulls the current workspace id out of the URL when the user is on a
 * `/w/:workspaceId/...` route. Returns null on dashboard, settings, admin,
 * etc. — those routes don't have a workspace context.
 */
function getWorkspaceIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/w\/([^/]+)/);
  return m ? m[1] : null;
}

function openReadOnlyCreateWarning() {
  toast.info("Read-only access", {
    description: "Your role can browse but not create documents.",
  });
}

function openPickWorkspaceWarning() {
  toast.info("Pick a workspace first", {
    description: "Open a workspace, then press G C to create a document.",
  });
}

export const GlobalShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useCurrentAccount();
  const sessionRole = getSessionRole(account);
  const isAuthed = !!account;
  const workspaceId = getWorkspaceIdFromPath(location.pathname);

  const navigateIfAuthed = (path: string) => {
    if (isAuthed) {
      navigate(path);
    }
  };

  const openReviewQueue = () => {
    if (isAuthed && sessionRole.canReview) {
      navigate("/review");
    }
  };

  const openNewDocument = () => {
    if (!isAuthed) return;
    if (sessionRole.isReadOnly) {
      openReadOnlyCreateWarning();
      return;
    }
    if (workspaceId) {
      navigate(`/w/${workspaceId}/documents/new`);
      return;
    }
    openPickWorkspaceWarning();
    navigate("/workspaces");
  };

  // Global commands — must work even when a dialog/palette is foregrounded.
  useHotkey("mod+k", () => emitOpenPalette(), { allowWhenModalOpen: true });
  useHotkey("shift+?", () => emitOpenHelp(), { allowWhenModalOpen: true });

  // Navigation — only when signed in.
  useHotkey("g d", () => navigateIfAuthed("/dashboard"));
  useHotkey("g w", () => navigateIfAuthed("/workspaces"));
  useHotkey("g n", () => navigateIfAuthed("/notifications"));
  useHotkey("g s", () => navigateIfAuthed("/settings"));
  useHotkey("g r", openReviewQueue);

  // Create new document in the current workspace.
  // Permission check: viewers cannot author content.
  useHotkey("g c", openNewDocument);

  return null;
};
