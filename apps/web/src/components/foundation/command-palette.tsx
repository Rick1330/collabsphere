"use client";

import * as React from "react";
import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from "react";

import { getFocusableElements, getFocusTrapTarget } from "./dialog-focus-trap";

export type CommandPaletteItem = {
  id: string;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  pill?: string;
  onSelect?: () => void | Promise<void>;
  disabled?: boolean;
};

export type CommandPaletteGroup = {
  id: string;
  label: string;
  items: readonly CommandPaletteItem[];
};

type CommandPaletteProps = {
  groups: readonly CommandPaletteGroup[];
  dialogId?: string;
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

type CommandPaletteCloseKey = "Escape";

export const isCommandPaletteCloseKey = (key: string): key is CommandPaletteCloseKey =>
  key === "Escape";

const getCommandPaletteItemDomId = (value: string) =>
  `command-palette-item-${value.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;

type CommandPaletteHeaderProps = {
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  descriptionId: string;
  titleId: string;
  onClose: () => void;
};

function CommandPaletteHeader({
  closeButtonRef,
  descriptionId,
  titleId,
  onClose,
}: Readonly<CommandPaletteHeaderProps>) {
  return (
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
        onClick={onClose}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </header>
  );
}

type CommandPaletteSearchProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (value: string) => void;
};

function CommandPaletteSearch({
  inputRef,
  onQueryChange,
  query,
}: Readonly<CommandPaletteSearchProps>) {
  return (
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
  );
}

type CommandPaletteResultsProps = {
  groups: readonly CommandPaletteGroup[];
  onItemSelect: (item: CommandPaletteItem) => void;
};

type CommandPaletteResultItemProps = {
  item: CommandPaletteItem;
  onSelect: () => void;
};

function CommandPaletteResultItem({ item, onSelect }: Readonly<CommandPaletteResultItemProps>) {
  const descriptionId = item.description
    ? `${getCommandPaletteItemDomId(item.id)}-description`
    : undefined;

  return (
    <button
      type="button"
      className="command-palette__item-button"
      aria-describedby={descriptionId}
      disabled={item.disabled}
      onClick={onSelect}
    >
      <span className="command-palette__item-icon" aria-hidden="true">
        {item.icon ?? "•"}
      </span>
      <span className="command-palette__item-copy">
        <span className="command-palette__item-label">{item.label}</span>
        {item.description ? (
          <span id={descriptionId} className="command-palette__item-description">
            {item.description}
          </span>
        ) : null}
      </span>
      {item.pill ? (
        <span className="command-palette__item-pill" aria-hidden="true">
          {item.pill}
        </span>
      ) : null}
    </button>
  );
}

function CommandPaletteResults({ groups, onItemSelect }: Readonly<CommandPaletteResultsProps>) {
  return (
    <section className="command-palette__results" aria-label="Command palette results">
      {groups.map((group) =>
        group.items.length > 0 ? (
          <div key={group.id} className="command-palette__group">
            <h3 className="command-palette__group-label">{group.label}</h3>
            <ul className="command-palette__group-list">
              {group.items.map((item) => (
                <li key={item.id} className="command-palette__item">
                  <CommandPaletteResultItem
                    item={item}
                    onSelect={() => {
                      onItemSelect(item);
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}

function CommandPaletteFooter() {
  return (
    <footer className="command-palette__footer" aria-label="Command palette hints">
      <span className="command-palette__hint">
        <kbd>Esc</kbd> close
      </span>
    </footer>
  );
}

export function CommandPalette({
  dialogId,
  groups,
  inputRef,
  isOpen,
  onClose,
  onQueryChange,
  query,
  returnFocusRef,
}: Readonly<CommandPaletteProps>) {
  const paletteId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = inputRef ?? internalInputRef;
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const closePalette = useCallback(() => {
    returnFocusRef?.current?.focus();
    onClose();
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    searchInputRef.current?.focus();
  }, [isOpen, searchInputRef]);

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
    const lastElement = focusableElements.at(-1);

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
      lastElement,
      shiftKey: event.shiftKey,
    });

    if (target != null) {
      event.preventDefault();
      target.focus();
    }
  };

  const titleId = `${paletteId}-title`;
  const descriptionId = `${paletteId}-description`;

  const handleItemSelect = useCallback(
    (item: CommandPaletteItem) => {
      let result: void | Promise<void>;
      try {
        result = item.onSelect?.();
      } catch (error_) {
        closePalette();
        throw error_;
      }

      if (result && typeof (result as Promise<void>).then === "function") {
        void (result as Promise<void>)
          .catch((error_) => {
            console.error("[CommandPalette] item onSelect failed", error_);
          })
          .finally(() => {
            closePalette();
          });
        return;
      }

      closePalette();
    },
    [closePalette],
  );

  return isOpen ? (
    <dialog
      ref={dialogRef}
      id={dialogId}
      className="command-palette__dialog"
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
        <CommandPaletteHeader
          closeButtonRef={closeButtonRef}
          descriptionId={descriptionId}
          titleId={titleId}
          onClose={closePalette}
        />
        <CommandPaletteSearch
          inputRef={searchInputRef}
          query={query}
          onQueryChange={onQueryChange}
        />
        <CommandPaletteResults groups={groups} onItemSelect={handleItemSelect} />
        <CommandPaletteFooter />
      </div>
    </dialog>
  ) : null;
}
