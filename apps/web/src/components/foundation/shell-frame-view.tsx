import Link from "next/link";
import * as React from "react";

import type { DesktopSidebarMode } from "../../lib/sidebar-state";
import type { NavItem } from "./navigation";

type ShellTone = "public" | "global" | "workspace" | "admin";

export type ShellFrameProps = {
  tone: ShellTone;
  sectionLabel: string;
  title: string;
  description: string;
  navItems?: NavItem[];
  sidebar?: React.ReactNode;
  headerAction?: React.ReactNode;
  topNav?: React.ReactNode;
  children: React.ReactNode;
};

type ShellFrameViewProps = ShellFrameProps & {
  dataSidebarState?: DesktopSidebarMode;
};

export function ShellFrameView({
  tone,
  sectionLabel,
  title,
  description,
  navItems,
  sidebar,
  headerAction,
  topNav,
  children,
  dataSidebarState,
}: ShellFrameViewProps) {
  const isRailOmitted = sidebar === null;
  const contentClassName =
    topNav == null ? "shell__content" : "shell__content shell__content--with-top-nav";
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
          {(navItems ?? []).map((item, index) => (
            <li key={`${item.href}-${index}`} className="shell__nav-item">
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
  const resolvedSidebar = sidebar !== undefined ? sidebar : rail;

  return (
    <div className={shellClassName} data-sidebar-state={dataSidebarState}>
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
