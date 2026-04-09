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
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const isMacLike = isMacLikePlatform({
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    });
    const handleKeyDown = (event: KeyboardEvent) => {
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
