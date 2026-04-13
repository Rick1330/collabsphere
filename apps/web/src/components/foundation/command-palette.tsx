"use client";

import * as React from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
} from "@collabsphere/ui/components/dialog";

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

type CommandPaletteKeyAction =
  | { kind: "navigate"; direction: CommandPaletteNavigationDirection }
  | { kind: "group"; direction: CommandPaletteNavigationDirection }
  | { kind: "select" }
  | null;

const commandPaletteStaticKeyActions: Readonly<Record<string, CommandPaletteKeyAction>> = {
  ArrowDown: { kind: "navigate", direction: "next" },
  ArrowUp: { kind: "navigate", direction: "previous" },
  Enter: { kind: "select" },
};

export const isCommandPaletteCloseKey = (key: string): key is CommandPaletteCloseKey =>
  key === "Escape";

const getCommandPaletteItemDomId = (value: string) =>
  `command-palette-item-${value.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;

function getCommandPaletteKeyAction(
  event: React.KeyboardEvent<HTMLInputElement>,
): CommandPaletteKeyAction {
  const hasModifier = event.altKey || event.metaKey || event.ctrlKey;
  if (event.defaultPrevented || hasModifier) {
    return null;
  }

  if (event.key === "Tab") {
    return { kind: "group", direction: event.shiftKey ? "previous" : "next" };
  }

  return commandPaletteStaticKeyActions[event.key] ?? null;
}

type CommandPaletteHeaderProps = {
  descriptionId: string;
  titleId: string;
  onClose: () => void;
};

function CommandPaletteHeader({
  descriptionId,
  titleId,
  onClose,
}: Readonly<CommandPaletteHeaderProps>) {
  return (
    <header className="command-palette__header">
      <div className="command-palette__header-copy">
        <DialogTitle id={titleId} className="command-palette__title">
          Command palette
        </DialogTitle>
        <DialogDescription id={descriptionId} className="command-palette__description">
          Type a command or search across your workspace.
        </DialogDescription>
      </div>
      <button
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
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onItemSelect: (item: CommandPaletteItem) => void;
};

function CommandPaletteResults({
  activeItemId,
  groups,
  onItemSelect,
  resultsId,
  searchInputRef,
}: Readonly<CommandPaletteResultsProps>) {
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
              {group.items.map((item) => {
                const optionId = getCommandPaletteItemDomId(item.id);
                const descriptionId = item.description ? `${optionId}-description` : undefined;
                const isActive = activeItemId === item.id;

                return (
                  <li key={item.id} className="command-palette__item" role="presentation">
                    <button
                      id={optionId}
                      type="button"
                      className="command-palette__item-button"
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={item.disabled ?? false}
                      aria-describedby={descriptionId}
                      disabled={item.disabled}
                      onMouseDown={(event) => {
                        if (item.disabled) {
                          return;
                        }

                        event.preventDefault();
                        searchInputRef.current?.focus();
                      }}
                      onClick={() => {
                        onItemSelect(item);
                      }}
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
                  </li>
                );
              })}
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
  if (!isOpen) {
    return null;
  }

  return (
    <CommandPaletteDialog
      dialogId={dialogId}
      groups={groups}
      inputRef={inputRef}
      isOpen={isOpen}
      onClose={onClose}
      onQueryChange={onQueryChange}
      query={query}
      returnFocusRef={returnFocusRef}
    />
  );
}

function CommandPaletteDialog({
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
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = inputRef ?? internalInputRef;
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const titleId = `${paletteId}-title`;
  const descriptionId = `${paletteId}-description`;
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
    if (!isOpen || activeItemId == null) {
      return;
    }

    if (!findItemById(groups, activeItemId)) {
      setActiveItemId(null);
    }
  }, [activeItemId, groups, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeDescendantId) {
      return;
    }

    document.getElementById(activeDescendantId)?.scrollIntoView({ block: "nearest" });
  }, [activeDescendantId, isOpen]);

  const navigate = useCallback(
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

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const action = getCommandPaletteKeyAction(event);
      if (!action) {
        return;
      }

      if (action.kind === "navigate") {
        event.preventDefault();
        navigate(action.direction);
        return;
      }

      if (action.kind === "group") {
        const nextGroupItem = getNextGroupItemId({
          groups,
          activeItemId,
          direction: action.direction,
        });

        if (!nextGroupItem) {
          return;
        }

        event.preventDefault();
        setActiveItemId(nextGroupItem);
        return;
      }

      const activeItem = findItemById(groups, activeItemId);
      if (!activeItem || activeItem.disabled || !activeItem.onSelect) {
        return;
      }

      event.preventDefault();
      handleItemSelect(activeItem);
    },
    [activeItemId, groups, handleItemSelect, navigate],
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closePalette();
        }
      }}
    >
      <div className="command-palette__dialog">
        <DialogOverlay className="command-palette__overlay" />
        <DialogContent
          id={dialogId}
          className="command-palette__panel"
          aria-describedby={descriptionId}
          aria-labelledby={titleId}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef?.current?.focus();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          <CommandPaletteHeader
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
        </DialogContent>
      </div>
    </Dialog>
  );
}
