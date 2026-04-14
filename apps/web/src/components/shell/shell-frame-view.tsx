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

const shellRailSurfaceStyle = {
  background: `linear-gradient(
    180deg,
    color-mix(in srgb, var(--section-accent, var(--color-accent)) 12%, var(--surface-card-subtle)) 0%,
    color-mix(in srgb, var(--section-accent, var(--color-accent)) 4%, var(--surface-card)) 100%
  )`,
} satisfies React.CSSProperties;

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
    "grid min-h-screen",
    isRailOmitted ? "grid-cols-1" : "grid-cols-[minmax(18rem,24rem)_1fr]",
  ]
    .filter(Boolean)
    .join(" ");
  const rail = (
    <aside
      className="shell__rail shell__rail--default relative grid content-start gap-6 border-r border-[color:var(--border-subtle)] px-6 py-6 text-[color:var(--color-text-primary)]"
      style={shellRailSurfaceStyle}
      aria-label={`${sectionLabel} navigation`}
    >
      <p className="shell__eyebrow mb-3 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
        {sectionLabel}
      </p>
      <h1 className="shell__title m-0 text-[clamp(2rem,3vw,3rem)] leading-[1.05] tracking-[-0.04em]">
        {title}
      </h1>
      <p className="shell__description m-0 max-w-[28ch] text-[color:var(--color-text-secondary)]">
        {description}
      </p>
      <nav className="shell__nav mt-8">
        <ul className="shell__nav-list m-0 grid list-none gap-3.5 p-0">
          {(navItems ?? []).map((item, index) => (
            <li key={`${item.href}-${index}`} className="shell__nav-item">
              <Link
                className="shell__nav-link grid gap-[0.15rem] rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[var(--surface-card)] px-[1.1rem] py-4 no-underline shadow-[var(--shadow-soft)]"
                href={item.href}
              >
                <span>{item.label}</span>
                <span className="shell__nav-hint text-[0.9rem] text-[color:var(--color-text-secondary)]">
                  {item.hint}
                </span>
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
      <div
        className={[
          contentClassName,
          "grid gap-6 px-6 py-6",
          topNav == null ? "grid-rows-[auto_1fr]" : "grid-rows-[auto_auto_1fr]",
        ].join(" ")}
      >
        {topNav == null ? null : topNav}
        <header className="shell__header">
          <div className="shell__header-intro">
            <span className="shell__eyebrow mb-3 block text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
              Next.js App Router foundation
            </span>
            <p className="shell__header-copy text-[color:var(--color-text-secondary)]">
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
