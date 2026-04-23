/**
 * Per-page command palette state.
 *
 * The keyboard shortcut for opening the palette (`⌘K`) lives in the global
 * shortcut layer (`app/shell/global-shortcuts.tsx`) and dispatches a window
 * event. This hook subscribes so any page that mounts a `<CommandPalette />`
 * can open it from anywhere — including from other shortcuts and the
 * "Keyboard shortcuts" entry inside the palette itself.
 */
import { useCallback, useEffect, useState } from "react";
import { SHORTCUT_EVENTS } from "@/lib/shortcut-events";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(SHORTCUT_EVENTS.openPalette, onOpen);
    return () => window.removeEventListener(SHORTCUT_EVENTS.openPalette, onOpen);
  }, []);

  return { open, setOpen, toggle };
}
