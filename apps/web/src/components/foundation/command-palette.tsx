"use client";

import * as React from "react";
import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from "react";

export type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  onSelect?: () => void;
};

export type CommandPaletteGroup = {
  id: string;
  label: string;
  items: readonly CommandPaletteItem[];
};

type CommandPaletteProps = {
  groups: readonly CommandPaletteGroup[];
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

type CommandPaletteCloseKey = "Escape";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const getFocusableElements = (container: HTMLElement | null): HTMLElement[] =>
  Array.from(container?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);

const getFocusTrapTarget = ({
  activeElement,
  firstElement,
  lastElement,
  shiftKey,
}: {
  activeElement: Element | null;
  firstElement: HTMLElement | undefined;
  lastElement: HTMLElement | undefined;
  shiftKey: boolean;
}): HTMLElement | null => {
  if (firstElement == null || lastElement == null) {
    return null;
  }

  if (shiftKey && activeElement === firstElement) {
    return lastElement;
  }

  if (!shiftKey && activeElement === lastElement) {
    return firstElement;
  }

  return null;
};

export const isCommandPaletteCloseKey = (key: string): key is CommandPaletteCloseKey =>
  key === "Escape";

export function CommandPalette({
  groups,
  isOpen,
  onClose,
  onQueryChange,
  query,
  returnFocusRef,
}: Readonly<CommandPaletteProps>) {
  const paletteId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const closePalette = useCallback(() => {
    returnFocusRef?.current?.focus();
    onClose();
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!isCommandPaletteCloseKey(event.key) || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      closePalette();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePalette, isOpen]);

  const handleDialogCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    closePalette();
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
        return;
      }

      dialogRef.current?.focus();
      return;
    }

    const target = getFocusTrapTarget({
      activeElement: document.activeElement,
      firstElement: focusableElements[0],
      lastElement: focusableElements[focusableElements.length - 1],
      shiftKey: event.shiftKey,
    });

    if (target != null) {
      event.preventDefault();
      target.focus();
    }
  };

  const titleId = `${paletteId}-title`;
  const descriptionId = `${paletteId}-description`;

  return isOpen ? (
    <dialog
      ref={dialogRef}
      className="command-palette__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      open
      tabIndex={-1}
      onCancel={handleDialogCancel}
      onKeyDown={handleDialogKeyDown}
    >
      <button
        type="button"
        className="command-palette__overlay"
        aria-label="Close command palette"
        onClick={closePalette}
      />
      <div className="command-palette__panel">
        <header className="command-palette__header">
          <div className="command-palette__header-copy">
            <p id={titleId} className="command-palette__title">
              Command palette
            </p>
            <p id={descriptionId} className="command-palette__description">
              Type a command or search across your workspace.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="command-palette__close"
            aria-label="Close command palette"
            onClick={closePalette}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className="command-palette__search" role="search">
          <span className="command-palette__search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            ref={inputRef}
            className="command-palette__search-input"
            type="search"
            autoFocus
            value={query}
            placeholder="Type a command or search..."
            aria-label="Search commands"
            onChange={(event) => {
              onQueryChange(event.currentTarget.value);
            }}
          />
        </div>

        <div
          className="command-palette__results"
          role="region"
          aria-label="Command palette results"
        >
          {groups.map((group) =>
            group.items.length > 0 ? (
              <section key={group.id} className="command-palette__group">
                <h3 className="command-palette__group-label">{group.label}</h3>
                <ul className="command-palette__group-list">
                  {group.items.map((item) => (
                    <li key={item.id} className="command-palette__item">
                      <button
                        type="button"
                        className="command-palette__item-button"
                        aria-label={item.label}
                        onClick={() => {
                          let error: unknown;
                          try {
                            item.onSelect?.();
                          } catch (caught) {
                            error = caught;
                          } finally {
                            closePalette();
                          }

                          if (error) {
                            throw error;
                          }
                        }}
                      >
                        <span className="command-palette__item-label">{item.label}</span>
                        {item.description ? (
                          <span className="command-palette__item-description">
                            {item.description}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>

        <footer className="command-palette__footer" aria-label="Command palette hints">
          <span className="command-palette__hint">
            <kbd>Esc</kbd> close
          </span>
        </footer>
      </div>
    </dialog>
  ) : null;
}
