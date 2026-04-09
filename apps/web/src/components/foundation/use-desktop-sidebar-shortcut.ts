"use client";

import * as React from "react";

import {
  handleDesktopSidebarShortcut,
  isMacLikePlatform,
} from "./desktop-sidebar-shortcut";

type UseDesktopSidebarShortcutOptions = {
  enabled: boolean;
  onToggle: () => void;
};

export const useDesktopSidebarShortcut = ({
  enabled,
  onToggle,
}: Readonly<UseDesktopSidebarShortcutOptions>) => {
  React.useEffect(() => {
    if (
      !enabled ||
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const desktopMediaQuery = window.matchMedia("(min-width: 1280px)");
    const isMacLike = isMacLikePlatform({
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!desktopMediaQuery.matches) {
        return;
      }

      handleDesktopSidebarShortcut({
        enabled,
        event,
        isMacLike,
        onToggle,
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onToggle]);
};
