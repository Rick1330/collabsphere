"use client";

import * as React from "react";

import {
  defaultDesktopSidebarMode,
  type DesktopSidebarMode,
} from "../../lib/sidebar-state";
import {
  ShellFrameView,
  type ShellFrameProps,
} from "./shell-frame-view";
import { useDesktopSidebarShortcut } from "./use-desktop-sidebar-shortcut";
import { useDesktopSidebarMode } from "./use-desktop-sidebar-mode";

type CollapsibleSidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  sidebarId?: string;
};

type CollapsibleShellFrameProps = ShellFrameProps & {
  defaultSidebarMode?: DesktopSidebarMode;
};

const getResolvedSidebar = ({
  railSidebar,
  sidebarId,
  sidebarMode,
  toggleSidebarMode,
}: {
  railSidebar: React.ReactNode;
  sidebarId: string;
  sidebarMode: DesktopSidebarMode;
  toggleSidebarMode: () => void;
}) => {
  if (!React.isValidElement(railSidebar)) {
    return railSidebar;
  }

  return React.cloneElement(railSidebar as React.ReactElement<CollapsibleSidebarProps>, {
    collapsed: sidebarMode === "collapsed",
    onToggleCollapse: toggleSidebarMode,
    sidebarId,
  });
};

export function CollapsibleShellFrame({
  defaultSidebarMode = defaultDesktopSidebarMode,
  sidebar,
  ...frameProps
}: Readonly<CollapsibleShellFrameProps>) {
  const sidebarId = React.useId();
  const canCollapseSidebar = React.isValidElement(sidebar);
  const { sidebarMode, toggleSidebarMode } = useDesktopSidebarMode({
    defaultMode: defaultSidebarMode,
    enabled: canCollapseSidebar,
  });
  useDesktopSidebarShortcut({
    enabled: canCollapseSidebar,
    onToggle: toggleSidebarMode,
  });

  return (
    <ShellFrameView
      {...frameProps}
      dataSidebarState={canCollapseSidebar ? sidebarMode : undefined}
      sidebar={
        canCollapseSidebar
          ? getResolvedSidebar({
              railSidebar: sidebar,
              sidebarId,
              sidebarMode,
              toggleSidebarMode,
            })
          : sidebar
      }
    />
  );
}
