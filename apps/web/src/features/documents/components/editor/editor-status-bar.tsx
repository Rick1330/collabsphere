import { useEffect, useState } from "react";
import { AlertCircle, Check, Circle, CloudOff, Loader2, Users, Wifi, WifiOff } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { relativeTime } from "@/lib/format";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";
export type ConnectionStatus = "connected" | "reconnecting" | "offline";

interface EditorStatusBarProps {
  editor: Editor | null;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  connectionStatus: ConnectionStatus;
  collaboratorCount: number;
}

export const EditorStatusBar = ({
  editor,
  saveStatus,
  lastSavedAt,
  connectionStatus,
  collaboratorCount,
}: EditorStatusBarProps) => {
  const [, force] = useState(0);
  // tick the relative time every 30s so "2m ago" updates while user is in the editor
  useEffect(() => {
    if (!lastSavedAt) return;
    const t = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, [lastSavedAt]);

  const text = editor?.getText() ?? "";
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;

  return (
    <div className="flex items-center justify-between h-8 px-4 border-t border-stone-100 bg-stone-50/50 flex-shrink-0 gap-3">
      {/* Left: word/char counts */}
      <div className="font-mono text-[10px] text-stone-400 tracking-wider flex items-center gap-1.5 min-w-0">
        <span className="truncate">
          {words.toLocaleString()} {words === 1 ? "WORD" : "WORDS"}
        </span>
        <span className="hidden sm:inline truncate">
          <span className="text-stone-300 mx-1.5">·</span>
          {chars.toLocaleString()} {chars === 1 ? "CHAR" : "CHARS"}
        </span>
      </div>

      {/* Right: collaborators + connection + save state */}
      <div className="flex items-center gap-3 font-mono text-[10px] tracking-wider flex-shrink-0">
        {/* Collaborators */}
        <div
          className="hidden md:flex items-center gap-1 text-stone-400"
          title={`${collaboratorCount} ${collaboratorCount === 1 ? "person" : "people"} viewing`}
        >
          <Users className="h-3 w-3" aria-hidden="true" />
          <span>
            {collaboratorCount} {collaboratorCount === 1 ? "VIEWER" : "VIEWERS"}
          </span>
        </div>

        {/* Connection */}
        <div className="hidden sm:flex items-center gap-1.5">
          {connectionStatus === "connected" && (
            <>
              <Wifi className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              <span className="text-emerald-600">CONNECTED</span>
            </>
          )}
          {connectionStatus === "reconnecting" && (
            <>
              <Loader2 className="h-3 w-3 text-amber-500 animate-spin" aria-hidden="true" />
              <span className="text-amber-600">RECONNECTING</span>
            </>
          )}
          {connectionStatus === "offline" && (
            <>
              <WifiOff className="h-3 w-3 text-red-500" aria-hidden="true" />
              <span className="text-red-600">OFFLINE</span>
            </>
          )}
        </div>

        {/* Save state */}
        <div role="status" aria-live="polite" className="flex items-center gap-1.5">
          {saveStatus === "saved" && connectionStatus === "connected" && (
            <>
              <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              <span className="text-emerald-600">SAVED</span>
              {lastSavedAt && (
                <span className="text-stone-300 ml-1 hidden lg:inline">
                  · {relativeTime(lastSavedAt)}
                </span>
              )}
            </>
          )}
          {saveStatus === "saved" && connectionStatus === "offline" && (
            <>
              <CloudOff className="h-3 w-3 text-red-500" aria-hidden="true" />
              <span className="text-red-600">CHANGES WILL SYNC</span>
            </>
          )}
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 text-stone-400 animate-spin" aria-hidden="true" />
              <span className="text-stone-400">SAVING</span>
            </>
          )}
          {saveStatus === "unsaved" && (
            <>
              <Circle className="h-2.5 w-2.5 text-amber-500 fill-amber-500" aria-hidden="true" />
              <span className="text-amber-600">UNSAVED</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertCircle className="h-3 w-3 text-red-500" aria-hidden="true" />
              <span className="text-red-600">SAVE FAILED</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
