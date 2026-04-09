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
  const [hasHydratedSidebarMode, setHasHydratedSidebarMode] =
    React.useState(!enabled);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    setSidebarMode(readStoredDesktopSidebarMode(window.localStorage));
    setHasHydratedSidebarMode(true);
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled || !hasHydratedSidebarMode || typeof window === "undefined") {
      return;
    }

    writeStoredDesktopSidebarMode(window.localStorage, sidebarMode);
  }, [enabled, hasHydratedSidebarMode, sidebarMode]);

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
