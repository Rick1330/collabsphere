"use client";

import * as React from "react";

import { CommandPalette, type CommandPaletteGroup } from "./command-palette";
import { isMacLikePlatform } from "./command-palette-shortcut";
import {
  buildCommandPaletteGroups,
  getSearchScopeFromPathname,
  normalizeCommandPaletteQuery,
} from "./command-palette-search-helpers";
import { useCommandPaletteSearch } from "./use-command-palette-search";
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
  const [pathname, setPathname] = React.useState<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const dialogId = `command-palette-${React.useId()}`;
  const normalizedQuery = normalizeCommandPaletteQuery(query);
  const searchScope = getSearchScopeFromPathname(pathname);
  const { status: searchStatus } = useCommandPaletteSearch({
    query: normalizedQuery,
    scope: searchScope.scope,
    workspaceId: searchScope.workspaceId,
  });

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

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setPathname(window.location.pathname);
  }, []);

  const openPalette = React.useCallback(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }

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

  const onSelectUrl = React.useCallback(
    (url: string) => {
      if (typeof window === "undefined") {
        return;
      }

      // Prefer a navigation method that works in unit tests without a mounted Next.js App Router.
      // If we later need SPA transitions, inject a Next router navigate callback from a boundary.
      window.location.assign(url);
    },
    [],
  );

  const groups = React.useMemo(
    () =>
      buildCommandPaletteGroups({
        baseGroups: commandPaletteGroups,
        normalizedQuery,
        onSelectUrl,
        status: searchStatus,
      }),
    [normalizedQuery, onSelectUrl, searchStatus],
  );

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
        groups={groups}
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

