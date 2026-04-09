"use client";

import * as React from "react";

import {
  defaultDesktopSidebarMode,
  writeStoredDesktopSidebarMode,
  readStoredDesktopSidebarMode,
  type DesktopSidebarMode,
} from "../../lib/sidebar-state";

type UseDesktopSidebarModeOptions = {
  defaultMode?: DesktopSidebarMode;
  enabled: boolean;
};

export const useDesktopSidebarMode = ({
  defaultMode = defaultDesktopSidebarMode,
  enabled,
}: Readonly<UseDesktopSidebarModeOptions>) => {
  const [sidebarMode, setSidebarMode] = React.useState<DesktopSidebarMode>(defaultMode);
  const hasHydratedSidebarMode = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      hasHydratedSidebarMode.current = false;
      return;
    }

    setSidebarMode(readStoredDesktopSidebarMode(window.localStorage));
    hasHydratedSidebarMode.current = true;
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled || !hasHydratedSidebarMode.current || typeof window === "undefined") {
      return;
    }

    writeStoredDesktopSidebarMode(window.localStorage, sidebarMode);
  }, [enabled, sidebarMode]);

  const toggleSidebarMode = React.useCallback(() => {
    setSidebarMode((currentMode) =>
      currentMode === "expanded" ? "collapsed" : "expanded",
    );
  }, []);

  return {
    sidebarMode,
    toggleSidebarMode,
  };
};
