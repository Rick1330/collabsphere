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

const desktopSidebarMediaQuery = "(min-width: 1280px)";

const canUseDesktopSidebarShortcut = (enabled: boolean) =>
  enabled && typeof window !== "undefined" && typeof window.matchMedia === "function";

const syncDesktopShortcutListener = (
  mediaQuery: MediaQueryList,
  listener: (event: KeyboardEvent) => void,
) => {
  window.removeEventListener("keydown", listener);

  if (mediaQuery.matches) {
    window.addEventListener("keydown", listener);
  }
};

const subscribeToMediaQuery = (
  mediaQuery: MediaQueryList,
  listener: () => void,
) => {
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }

  const legacyMediaQuery = mediaQuery as MediaQueryList & {
    addListener: (listener: () => void) => void;
    removeListener: (listener: () => void) => void;
  };

  legacyMediaQuery.addListener(listener);

  return () => {
    legacyMediaQuery.removeListener(listener);
  };
};

export const useDesktopSidebarShortcut = ({
  enabled,
  onToggle,
}: Readonly<UseDesktopSidebarShortcutOptions>) => {
  React.useEffect(() => {
    if (!canUseDesktopSidebarShortcut(enabled)) {
      return;
    }

    const mediaQuery = window.matchMedia(desktopSidebarMediaQuery);
    const isMacLike = isMacLikePlatform({
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      handleDesktopSidebarShortcut({
        enabled: true,
        event,
        isMacLike,
        onToggle,
      });
    };
    const handleMediaChange = () => {
      syncDesktopShortcutListener(mediaQuery, handleKeyDown);
    };

    syncDesktopShortcutListener(mediaQuery, handleKeyDown);
    const unsubscribe = subscribeToMediaQuery(mediaQuery, handleMediaChange);

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onToggle]);
};
