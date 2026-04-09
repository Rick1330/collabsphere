"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  globalSidebarActionItems,
  globalSidebarPrimaryItems,
  isGlobalSidebarItemActive,
  type GlobalSidebarItem,
} from "./navigation";

type SidebarCollapseProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  sidebarId?: string;
};

type GlobalSidebarSectionProps = {
  collapsed: boolean;
  currentPathname: string | null;
  items: readonly GlobalSidebarItem[];
  label: string;
};

type GlobalSidebarViewProps = SidebarCollapseProps & {
  actionItems?: readonly GlobalSidebarItem[];
  currentPathname: string | null;
  primaryItems?: readonly GlobalSidebarItem[];
};

function GlobalSidebarSection({
  collapsed,
  currentPathname,
  items,
  label,
}: Readonly<GlobalSidebarSectionProps>) {
  return (
    <section className="global-sidebar__section" aria-labelledby={`global-sidebar-${label}`}>
      <p id={`global-sidebar-${label}`} className="global-sidebar__section-label">
        {label}
      </p>
      <ul className="shell__nav-list global-sidebar__list">
        {items.map((item) => {
          const isActive = isGlobalSidebarItemActive(currentPathname, item);

          return (
            <li key={item.href} className="shell__nav-item">
              <Link
                className="shell__nav-link global-sidebar__link"
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                href={item.href}
                title={collapsed ? item.label : undefined}
              >
                <span className="global-sidebar__link-mark" aria-hidden="true">
                  {item.mark}
                </span>
                <span className="global-sidebar__link-copy">
                  <span className="global-sidebar__link-label">{item.label}</span>
                  <span className="global-sidebar__link-description">
                    {item.description}
                  </span>
                </span>
                <span className="global-sidebar__link-tag">{item.tag}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function GlobalSidebarView({
  actionItems = globalSidebarActionItems,
  collapsed = false,
  currentPathname,
  onToggleCollapse,
  primaryItems = globalSidebarPrimaryItems,
  sidebarId,
}: Readonly<GlobalSidebarViewProps>) {
  const generatedSidebarId = React.useId();
  const effectiveSidebarId = sidebarId ?? generatedSidebarId;

  return (
    <aside
      id={effectiveSidebarId}
      className="shell__rail global-sidebar"
      aria-label="Global navigation"
      data-collapsed={collapsed}
    >
      {onToggleCollapse ? (
        <button
          type="button"
          className="sidebar-collapse-toggle"
          aria-controls={effectiveSidebarId}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
        >
          <span aria-hidden="true">{collapsed ? ">" : "<"}</span>
        </button>
      ) : null}
      <div className="global-sidebar__header">
        <p className="shell__eyebrow">Global navigation</p>
        <h1 className="shell__title global-sidebar__title">CollabSphere</h1>
        <p className="shell__description global-sidebar__description">
          Persistent global routing now lives beside the top nav so authenticated
          pages keep orientation without inventing workspace-only context.
        </p>
      </div>

      <nav className="global-sidebar__nav" aria-label="Global routes">
        <GlobalSidebarSection
          collapsed={collapsed}
          currentPathname={currentPathname}
          items={primaryItems}
          label="Routes"
        />
        <GlobalSidebarSection
          collapsed={collapsed}
          currentPathname={currentPathname}
          items={actionItems}
          label="Actions"
        />
      </nav>

      <section className="global-sidebar__supplement" aria-labelledby="global-sidebar-recent">
        <p id="global-sidebar-recent" className="global-sidebar__supplement-label">
          Recent workspaces
        </p>
        <p className="global-sidebar__supplement-copy">
          The live top-nav workspace switcher remains the truthful recent-workspace
          entrypoint until dedicated sidebar history lands in a later baton.
        </p>
      </section>
    </aside>
  );
}

export function GlobalSidebar(props: Readonly<SidebarCollapseProps>) {
  const pathname = usePathname();

  return <GlobalSidebarView currentPathname={pathname} {...props} />;
}
