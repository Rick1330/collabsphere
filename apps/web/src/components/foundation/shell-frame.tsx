import Link from "next/link";
import * as React from "react";

import type { NavItem } from "./navigation";

type ShellTone = "public" | "global" | "workspace" | "admin";

type ShellFrameProps = {
  tone: ShellTone;
  sectionLabel: string;
  title: string;
  description: string;
  navItems: NavItem[];
  headerAction?: React.ReactNode;
  topNav?: React.ReactNode;
  children: React.ReactNode;
};

export function ShellFrame({
  tone,
  sectionLabel,
  title,
  description,
  navItems,
  headerAction,
  topNav,
  children,
}: ShellFrameProps) {
  return (
    <div className={`shell shell--${tone}`}>
      <aside className="shell__rail" aria-label={`${sectionLabel} navigation`}>
        <p className="shell__eyebrow">{sectionLabel}</p>
        <h1 className="shell__title">{title}</h1>
        <p className="shell__description">{description}</p>
        <nav className="shell__nav">
          <ul className="shell__nav-list">
            {navItems.map((item) => (
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
      <div className="shell__content">
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

