/**
 * Tiny global event bus for shortcut-driven UI surfaces.
 *
 * Keyboard shortcuts need to open the command palette and shortcut help
 * dialog from anywhere — including pages where neither component owns the
 * trigger. Rather than thread props or invent a context, we publish two
 * named CustomEvents on `window` that the palette + help dialog listen for.
 *
 * This stays decoupled from React Query / Router and works in the existing
 * per-page palette + sidebar wiring.
 */

export const SHORTCUT_EVENTS = {
  openPalette: "cs:shortcut:open-palette",
  openHelp: "cs:shortcut:open-help",
} as const;

export function emitOpenPalette() {
  window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.openPalette));
}

export function emitOpenHelp() {
  window.dispatchEvent(new CustomEvent(SHORTCUT_EVENTS.openHelp));
}
