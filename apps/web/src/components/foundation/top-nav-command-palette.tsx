"use client";

import * as React from "react";

import { CommandPalette, type CommandPaletteGroup } from "./command-palette";
import { isMacLikePlatform } from "./command-palette-shortcut";
import { useCommandPaletteShortcut } from "./use-command-palette-shortcut";

const commandPaletteGroups: readonly CommandPaletteGroup[] = [
  {
    id: "recent",
    label: "Recent",
    items: [
      {
        id: "recent-dashboard",
        label: "Dashboard",
        description: "Quick return to the global overview",
      },
      {
        id: "recent-workspaces",
        label: "Workspaces",
        description: "Recent and starred collaboration spaces",
      },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      {
        id: "action-new-workspace",
        label: "Create new workspace",
        description: "Start a new shared project space",
      },
      {
        id: "action-settings",
        label: "Go to settings",
        description: "Manage profile and app preferences",
      },
    ],
  },
];

type TopNavCommandPaletteProps = {
  initialOpen?: boolean;
};

export function TopNavCommandPalette({
  initialOpen = false,
}: Readonly<TopNavCommandPaletteProps>) {
  const [isOpen, setIsOpen] = React.useState(initialOpen);
  const [query, setQuery] = React.useState("");
  const [modifierLabel, setModifierLabel] = React.useState<"Ctrl" | "Cmd">("Ctrl");
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const dialogId = `command-palette-${React.useId()}`;

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isMacLike = isMacLikePlatform({
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    });

    setModifierLabel(isMacLike ? "Cmd" : "Ctrl");
  }, []);

  const openPalette = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePalette = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const refocusInput = React.useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useCommandPaletteShortcut({
    enabled: true,
    isOpen,
    onOpen: openPalette,
    onRefocusInput: refocusInput,
  });

  return (
    <>
      <div className="top-nav__search top-nav__search--desktop-only" role="search">
        <button
          ref={triggerRef}
          type="button"
          className="top-nav__search-trigger"
          aria-controls={isOpen ? dialogId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label="Open command palette"
          onClick={openPalette}
        >
          <span className="top-nav__control-mark" aria-hidden="true">
            SR
          </span>
          <span className="top-nav__control-copy">
            <span className="top-nav__control-label">Search the collaboration graph</span>
            <span className="top-nav__control-description">
              Search workspaces, documents, and commands
            </span>
          </span>
          <span className="top-nav__shortcut" aria-hidden="true">
            <kbd>{modifierLabel}</kbd>
            <kbd>K</kbd>
          </span>
        </button>
      </div>
      <CommandPalette
        dialogId={dialogId}
        groups={commandPaletteGroups}
        inputRef={inputRef}
        isOpen={isOpen}
        onClose={closePalette}
        onQueryChange={setQuery}
        query={query}
        returnFocusRef={triggerRef}
      />
    </>
  );
}

