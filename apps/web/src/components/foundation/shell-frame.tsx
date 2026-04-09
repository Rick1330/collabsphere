"use client";

import Link from "next/link";
import * as React from "react";

import type { NavItem } from "./navigation";
import { useDesktopSidebarMode } from "./use-desktop-sidebar-mode";
import {
  defaultDesktopSidebarMode,
  type DesktopSidebarMode,
} from "../../lib/sidebar-state";

type ShellTone = "public" | "global" | "workspace" | "admin";

type CollapsibleSidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  sidebarId?: string;
};

type ShellFrameProps = {
  tone: ShellTone;
  sectionLabel: string;
  title: string;
  description: string;
  navItems?: NavItem[];
  sidebar?: React.ReactNode;
  collapsibleSidebar?: boolean;
  defaultSidebarMode?: DesktopSidebarMode;
  headerAction?: React.ReactNode;
  topNav?: React.ReactNode;
  children: React.ReactNode;
};

const getResolvedSidebar = ({
  canCollapseSidebar,
  rail,
  sidebar,
  sidebarId,
  sidebarMode,
  toggleSidebarMode,
}: {
  canCollapseSidebar: boolean;
  rail: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarId: string;
  sidebarMode: DesktopSidebarMode;
  toggleSidebarMode: () => void;
}) => {
  if (!canCollapseSidebar || !React.isValidElement(sidebar)) {
    return sidebar !== undefined ? sidebar : rail;
  }

  return React.cloneElement(sidebar as React.ReactElement<CollapsibleSidebarProps>, {
    collapsed: sidebarMode === "collapsed",
    onToggleCollapse: toggleSidebarMode,
    sidebarId,
  });
};

export function ShellFrame({
  tone,
  sectionLabel,
  title,
  description,
  navItems,
  sidebar,
  collapsibleSidebar = false,
  defaultSidebarMode = defaultDesktopSidebarMode,
  headerAction,
  topNav,
  children,
}: ShellFrameProps) {
  const isRailOmitted = sidebar === null;
  const canCollapseSidebar = collapsibleSidebar && React.isValidElement(sidebar);
  const contentClassName =
    topNav == null ? "shell__content" : "shell__content shell__content--with-top-nav";
  const sidebarId = React.useId();
  const { sidebarMode, toggleSidebarMode } = useDesktopSidebarMode({
    defaultMode: defaultSidebarMode,
    enabled: canCollapseSidebar,
  });
  const shellClassName = [
    "shell",
    `shell--${tone}`,
    topNav == null ? null : "shell--has-top-nav",
    isRailOmitted ? "shell--no-rail" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const rail = (
    <aside className="shell__rail shell__rail--default" aria-label={`${sectionLabel} navigation`}>
      <p className="shell__eyebrow">{sectionLabel}</p>
      <h1 className="shell__title">{title}</h1>
      <p className="shell__description">{description}</p>
      <nav className="shell__nav">
        <ul className="shell__nav-list">
          {(navItems ?? []).map((item) => (
            <li key={item.href} className="shell__nav-item">
              <Link className="shell__nav-link" href={item.href}>
                <span>{item.label}</span>
                <span className="shell__nav-hint">{item.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
  const resolvedSidebar = getResolvedSidebar({
    canCollapseSidebar,
    rail,
    sidebar,
    sidebarId,
    sidebarMode,
    toggleSidebarMode,
  });

  return (
    <div
      className={shellClassName}
      data-sidebar-state={canCollapseSidebar ? sidebarMode : undefined}
    >
      {resolvedSidebar}
      <div className={contentClassName}>
        {topNav == null ? null : topNav}
        <header className="shell__header">
          <div className="shell__header-intro">
            <span className="shell__eyebrow">Next.js App Router foundation</span>
            <p className="shell__header-copy">
              Route/layout architecture is live. Feature stories still need to
              layer in auth, navigation behavior, data fetching, and final UI.
            </p>
          </div>
          {headerAction == null ? null : (
            <div className="shell__header-actions">{headerAction}</div>
          )}
        </header>
        <main id="main-content" className="shell__main">
          {children}
        </main>
      </div>
    </div>
  );
}

