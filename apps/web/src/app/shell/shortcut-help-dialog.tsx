/**
 * ShortcutHelpDialog
 *
 * A restrained, single-screen reference of every shortcut the app exposes.
 * Opens via:
 *   - `?` (global hotkey)
 *   - the "Keyboard shortcuts" entry in the command palette
 *   - the user dropdown menu (future surface)
 *
 * Reads the canonical shortcut list from `lib/shortcuts.ts` so this stays
 * in lockstep with what the app actually wires up.
 */
import { useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SHORTCUT_EVENTS } from "@/lib/shortcut-events";
import { shortcutsByGroup, type ShortcutDef } from "@/lib/shortcuts";

export const ShortcutHelpDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    globalThis.addEventListener(SHORTCUT_EVENTS.openHelp, onOpen);
    return () => globalThis.removeEventListener(SHORTCUT_EVENTS.openHelp, onOpen);
  }, []);

  const groups = shortcutsByGroup();
  const order = ["Global", "Navigation", "Documents", "Tasks", "Review"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card border-border">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center">
              <Keyboard className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground leading-tight">
                Keyboard shortcuts
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Power-user moves across the app
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="h-7 w-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {order.map((groupName) => {
              const items = groups[groupName];
              if (!items || items.length === 0) return null;
              return (
                <section key={groupName} aria-labelledby={`sc-${groupName}`}>
                  <h3
                    id={`sc-${groupName}`}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/80 mb-2"
                  >
                    {groupName}
                  </h3>
                  <ul className="space-y-1.5">
                    {items.map((s) => (
                      <ShortcutRow key={s.id} shortcut={s} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Press <KbdInline>?</KbdInline> any time to open this list.
          </p>
          <span className="font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase">
            CollabSphere
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShortcutRow = ({ shortcut }: { shortcut: ShortcutDef }) => (
  <li className="flex items-start justify-between gap-3 group">
    <div className="min-w-0">
      <p className="text-[13px] text-foreground leading-snug">{shortcut.label}</p>
      {shortcut.hint && (
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
          {shortcut.hint}
        </p>
      )}
    </div>
    <div className="flex items-center gap-1 shrink-0 pt-0.5">
      {shortcut.keys.map((k, i) => (
        <KbdInline key={i}>{k}</KbdInline>
      ))}
    </div>
  </li>
);

const KbdInline = ({ children }: { children: React.ReactNode }) => (
  <kbd
    className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded
      bg-card border border-border border-b-2
      font-mono text-[10px] text-muted-foreground tracking-wide"
  >
    {children}
  </kbd>
);
