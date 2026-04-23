/**
 * useHotkey — minimal, opinionated keyboard shortcut hook.
 *
 * Goals:
 *  - Stay out of the user's way while they're typing in inputs, textareas,
 *    contenteditable surfaces (TipTap, comment composers, the palette input).
 *  - Be cheap: a single shared listener model — every consumer registers an
 *    independent `keydown` handler and decides whether to respond.
 *  - Support both single-chord shortcuts (`mod+k`, `?`) and 2-key sequences
 *    (`g d`, `g w`) without pulling in a dependency.
 *
 * Conventions:
 *  - Spec strings are space-separated tokens. Modifiers are `mod` (⌘ on mac,
 *    Ctrl elsewhere), `shift`, `alt`. Examples: `"mod+k"`, `"shift+?"`, `"g d"`.
 *  - 2-key sequences (`"g d"`) only fire when neither key uses a modifier.
 *  - Sequence buffer resets after 1.2s of inactivity.
 *
 * Anything fancier (chords with 3+ keys, conflict resolution UI, etc.) is
 * intentionally out of scope — keep the surface tiny.
 */
import { useEffect, useRef } from "react";

export type HotkeyHandler = (e: KeyboardEvent) => void;

export interface HotkeyOptions {
  /** Allow the hotkey to fire even when focus is inside a text input. Default false. */
  allowInInput?: boolean;
  /**
   * Allow the hotkey to fire while a modal dialog or command palette is open.
   * Default false — global hotkeys must not steal focus from a foreground
   * dialog (Radix Dialog, Sheet, AlertDialog) or the cmdk command palette.
   */
  allowWhenModalOpen?: boolean;
  /** Disable without unmounting (e.g. when a dialog is open). Default false. */
  disabled?: boolean;
  /** preventDefault when matched. Default true. */
  preventDefault?: boolean;
}

const SEQUENCE_TIMEOUT_MS = 1200;

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  // TipTap renders a contenteditable child inside a wrapper.
  if (target.closest('[contenteditable="true"]')) return true;
  return false;
}

/**
 * Detects whether a foreground modal surface is currently open. We respect:
 *   - Radix dialogs / sheets / alert dialogs — their content roots carry
 *     `[role="dialog"][data-state="open"]`.
 *   - The cmdk command palette — rendered as `[cmdk-root]` only while open.
 * Either signal is enough to suppress global shortcuts.
 */
function isModalOpen(): boolean {
  if (typeof document === "undefined") return false;
  const dialog = document.querySelector('[role="dialog"][data-state="open"]');
  if (dialog) return true;
  const palette = document.querySelector("[cmdk-root]");
  if (palette) return true;
  return false;
}

interface ParsedToken {
  key: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
}

function parseToken(raw: string): ParsedToken {
  const parts = raw.toLowerCase().split("+");
  const t: ParsedToken = { key: "", mod: false, shift: false, alt: false };
  for (const p of parts) {
    if (p === "mod") t.mod = true;
    else if (p === "shift") t.shift = true;
    else if (p === "alt" || p === "option") t.alt = true;
    else t.key = p;
  }
  return t;
}

function matchesToken(e: KeyboardEvent, token: ParsedToken): boolean {
  const modActive = isMac() ? e.metaKey : e.ctrlKey;
  if (token.mod !== modActive) return false;
  if (token.shift !== e.shiftKey) return false;
  if (token.alt !== e.altKey) return false;
  // Compare key — case-insensitive, accept Space/Enter aliases.
  const k = e.key.toLowerCase();
  const expected = token.key === "space" ? " " : token.key;
  return k === expected;
}

export function useHotkey(
  spec: string,
  handler: HotkeyHandler,
  options: HotkeyOptions = {},
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const tokens = spec.trim().split(/\s+/).map(parseToken);
    const isSequence = tokens.length > 1;

    let bufferIndex = 0;
    let timer: ReturnType<typeof globalThis.setTimeout> | undefined;

    const reset = () => {
      bufferIndex = 0;
      if (timer !== undefined) {
        globalThis.clearTimeout(timer);
        timer = undefined;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const opts = optsRef.current;
      if (opts.disabled) return;
      if (!opts.allowInInput && isEditableTarget(e.target)) return;
      if (!opts.allowWhenModalOpen && isModalOpen()) return;

      // Single-chord
      if (!isSequence) {
        if (matchesToken(e, tokens[0])) {
          if (opts.preventDefault !== false) e.preventDefault();
          handlerRef.current(e);
        }
        return;
      }

      // Sequence — modifiers must be off for sequence steps.
      if (e.metaKey || e.ctrlKey || e.altKey) {
        reset();
        return;
      }

      const expected = tokens[bufferIndex];
      if (matchesToken(e, expected)) {
        bufferIndex += 1;
        if (bufferIndex >= tokens.length) {
          if (opts.preventDefault !== false) e.preventDefault();
          handlerRef.current(e);
          reset();
          return;
        }
        if (timer !== undefined) globalThis.clearTimeout(timer);
        timer = globalThis.setTimeout(reset, SEQUENCE_TIMEOUT_MS);
      } else {
        reset();
      }
    };

    globalThis.addEventListener("keydown", onKey);
    return () => {
      globalThis.removeEventListener("keydown", onKey);
      reset();
    };
  }, [spec]);
}

/** Exposed for tests. */
export const __testables = { isEditableTarget, isModalOpen, parseToken, matchesToken };
