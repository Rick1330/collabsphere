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
  const [hasHydratedSidebarMode, setHasHydratedSidebarMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!enabled) {
      setHasHydratedSidebarMode(false);
      return;
    }

    setSidebarMode(readStoredDesktopSidebarMode(window.localStorage));
    setHasHydratedSidebarMode(true);
  }, [enabled]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!enabled) {
      return;
    }

    if (!hasHydratedSidebarMode) {
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
