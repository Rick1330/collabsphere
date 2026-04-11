"use client";

import * as React from "react";
import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from "react";

import { getFocusableElements, getFocusTrapTarget } from "./dialog-focus-trap";
import {
  findItemById,
  getNextGroupItemId,
  getNextSelectableItemId,
  type CommandPaletteNavigationDirection,
} from "./command-palette-navigation";

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

type CommandPaletteKey =
  | "ArrowDown"
  | "ArrowUp"
  | "Enter"
  | "Tab";

const isCommandPaletteNavigationKey = (key: string): key is CommandPaletteKey =>
  key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === "Tab";

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
  activeDescendantId: string | undefined;
  resultsId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

function CommandPaletteSearch({
  activeDescendantId,
  inputRef,
  onQueryChange,
  onKeyDown,
  query,
  resultsId,
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
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={true}
        aria-controls={resultsId}
        aria-activedescendant={activeDescendantId}
        autoFocus
        value={query}
        placeholder="Type a command or search..."
        aria-label="Search commands"
        onChange={(event) => {
          onQueryChange(event.currentTarget.value);
        }}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

type CommandPaletteResultsProps = {
  groups: readonly CommandPaletteGroup[];
  activeItemId: string | null;
  resultsId: string;
  onItemSelect: (item: CommandPaletteItem) => void;
};

type CommandPaletteResultItemProps = {
  activeItemId: string | null;
  item: CommandPaletteItem;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
};

function CommandPaletteResultItem({
  activeItemId,
  item,
  searchInputRef,
  onSelect,
}: Readonly<CommandPaletteResultItemProps>) {
  const optionId = getCommandPaletteItemDomId(item.id);
  const descriptionId = item.description ? `${optionId}-description` : undefined;
  const isActive = activeItemId === item.id;

  return (
    <button
      id={optionId}
      type="button"
      className="command-palette__item-button"
      role="option"
      aria-selected={isActive}
      aria-describedby={descriptionId}
      disabled={item.disabled}
      onMouseDown={(event) => {
        if (item.disabled) {
          return;
        }

        // Keep focus anchored in the input so aria-activedescendant remains the active model.
        event.preventDefault();
        searchInputRef.current?.focus();
      }}
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

function CommandPaletteResults({
  activeItemId,
  groups,
  onItemSelect,
  resultsId,
  searchInputRef,
}: Readonly<
  CommandPaletteResultsProps & { searchInputRef: React.RefObject<HTMLInputElement | null> }
>) {
  return (
    <section
      id={resultsId}
      className="command-palette__results"
      role="listbox"
      aria-label="Command palette results"
    >
      {groups.map((group) =>
        group.items.length > 0 ? (
          <div
            key={group.id}
            className="command-palette__group"
            role="group"
            aria-labelledby={`${resultsId}-group-${group.id}`}
          >
            <h3 id={`${resultsId}-group-${group.id}`} className="command-palette__group-label">
              {group.label}
            </h3>
            <ul className="command-palette__group-list" role="presentation">
              {group.items.map((item) => (
                <li key={item.id} className="command-palette__item" role="presentation">
                  <CommandPaletteResultItem
                    activeItemId={activeItemId}
                    item={item}
                    searchInputRef={searchInputRef}
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
        <kbd>↑</kbd>
        <kbd>↓</kbd> navigate
      </span>
      <span className="command-palette__hint">
        <kbd>Enter</kbd> select
      </span>
      <span className="command-palette__hint">
        <kbd>Tab</kbd> group
      </span>
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
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  const resultsId = `${paletteId}-results`;
  const activeDescendantId = activeItemId ? getCommandPaletteItemDomId(activeItemId) : undefined;

  const closePalette = useCallback(() => {
    returnFocusRef?.current?.focus();
    onClose();
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    searchInputRef.current?.focus();
    setActiveItemId(null);
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (activeItemId == null) {
      return;
    }

    if (!findItemById(groups, activeItemId)) {
      setActiveItemId(null);
    }
  }, [activeItemId, groups, isOpen]);

  const handleDialogCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    closePalette();
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab" || event.defaultPrevented) {
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
      if (!item.onSelect) {
        return;
      }

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

  const handleNavigate = useCallback(
    (direction: CommandPaletteNavigationDirection) => {
      setActiveItemId((current) =>
        getNextSelectableItemId({
          groups,
          activeItemId: current,
          direction,
        }),
      );
    },
    [groups],
  );

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isCommandPaletteNavigationKey(event.key) || event.defaultPrevented) {
        return;
      }

      if (event.altKey || event.metaKey || event.ctrlKey) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        handleNavigate("next");
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        handleNavigate("previous");
        return;
      }

      if (event.key === "Tab") {
        const nextGroupItem = getNextGroupItemId({
          groups,
          activeItemId,
          direction: event.shiftKey ? "previous" : "next",
        });

        // If we don't have any selectable items, let Tab behave normally so the focus trap works.
        if (!nextGroupItem) {
          return;
        }

        event.preventDefault();
        setActiveItemId(nextGroupItem);
        return;
      }

      if (event.key === "Enter") {
        const activeItem = findItemById(groups, activeItemId);
        if (!activeItem || activeItem.disabled || !activeItem.onSelect) {
          return;
        }

        event.preventDefault();
        handleItemSelect(activeItem);
      }
    },
    [activeItemId, groups, handleItemSelect, handleNavigate],
  );

  useEffect(() => {
    if (!isOpen || !activeDescendantId) {
      return;
    }

    const element = document.getElementById(activeDescendantId);
    element?.scrollIntoView({ block: "nearest" });
  }, [activeDescendantId, isOpen]);

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
          activeDescendantId={activeDescendantId}
          inputRef={searchInputRef}
          query={query}
          onQueryChange={onQueryChange}
          onKeyDown={handleSearchKeyDown}
          resultsId={resultsId}
        />
        <CommandPaletteResults
          groups={groups}
          activeItemId={activeItemId}
          onItemSelect={handleItemSelect}
          resultsId={resultsId}
          searchInputRef={searchInputRef}
        />
        <CommandPaletteFooter />
      </div>
    </dialog>
  ) : null;
}
