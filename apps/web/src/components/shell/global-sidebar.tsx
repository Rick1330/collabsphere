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

const globalSidebarMarkStyle = {
  background: `linear-gradient(
    135deg,
    color-mix(in srgb, var(--section-accent, var(--color-accent)) 20%, var(--surface-card)),
    color-mix(in srgb, var(--surface-card-subtle) 92%, var(--surface-card))
  )`,
  boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(--color-border) 62%, transparent)`,
} satisfies React.CSSProperties;

const globalSidebarTagStyle = {
  background: `color-mix(in srgb, var(--section-accent, var(--color-accent)) 14%, var(--surface-card))`,
} satisfies React.CSSProperties;

const globalSidebarSupplementStyle = {
  background: `linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-card) 94%, var(--color-bg-secondary)) 0%,
    color-mix(in srgb, var(--surface-card-subtle) 88%, var(--surface-card)) 100%
  )`,
  boxShadow: "var(--shadow-soft)",
} satisfies React.CSSProperties;

function GlobalSidebarSection({
  collapsed,
  currentPathname,
  items,
  label,
}: Readonly<GlobalSidebarSectionProps>) {
  return (
    <section
      className="global-sidebar__section grid gap-[0.7rem]"
      aria-labelledby={`global-sidebar-${label}`}
    >
      <p
        id={`global-sidebar-${label}`}
        className="global-sidebar__section-label m-0 text-[0.76rem] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]"
      >
        {label}
      </p>
      <ul className="shell__nav-list global-sidebar__list m-0 grid list-none gap-3 p-0">
        {items.map((item) => {
          const isActive = isGlobalSidebarItemActive(currentPathname, item);

          return (
            <li key={item.href} className="shell__nav-item">
              <Link
                className="shell__nav-link global-sidebar__link grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[var(--surface-card)] px-[1.1rem] py-4 no-underline shadow-[var(--shadow-soft)]"
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                href={item.href}
                title={collapsed ? item.label : undefined}
              >
                <span
                  className="global-sidebar__link-mark inline-grid min-h-10 w-10 place-items-center rounded-[0.9rem] text-[0.72rem] font-extrabold tracking-[0.08em] text-[color:var(--color-text-secondary)]"
                  style={globalSidebarMarkStyle}
                  aria-hidden="true"
                >
                  {item.mark}
                </span>
                <span className="global-sidebar__link-copy grid min-w-0 gap-[0.16rem]">
                  <span className="global-sidebar__link-label font-bold text-[color:var(--color-text-primary)]">
                    {item.label}
                  </span>
                  <span className="global-sidebar__link-description text-[0.88rem] text-[color:var(--color-text-secondary)]">
                    {item.description}
                  </span>
                </span>
                <span
                  className="global-sidebar__link-tag inline-flex min-w-[3.4rem] items-center justify-center self-start rounded-full px-[0.55rem] py-[0.28rem] text-[0.75rem] font-bold text-[color:var(--color-text-secondary)]"
                  style={globalSidebarTagStyle}
                >
                  {item.tag}
                </span>
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
      className="shell__rail global-sidebar relative grid content-start gap-[1.35rem] border-r border-[color:var(--border-subtle)] px-6 py-6 text-[color:var(--color-text-primary)]"
      style={{
        background: `linear-gradient(
          180deg,
          color-mix(in srgb, var(--section-accent, var(--color-accent)) 12%, var(--surface-card-subtle)) 0%,
          color-mix(in srgb, var(--section-accent, var(--color-accent)) 4%, var(--surface-card)) 100%
        )`,
      }}
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
      <div className="global-sidebar__header grid gap-4">
        <p className="shell__eyebrow m-0 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
          Global navigation
        </p>
        <h1 className="shell__title global-sidebar__title m-0 text-[clamp(1.9rem,2.4vw,2.6rem)] leading-[1.05] tracking-[-0.04em]">
          CollabSphere
        </h1>
        <p className="shell__description global-sidebar__description m-0 max-w-[30ch] text-[color:var(--color-text-secondary)]">
          Persistent global routing now lives beside the top nav so authenticated
          pages keep orientation without inventing workspace-only context.
        </p>
      </div>

      <nav className="global-sidebar__nav grid gap-4" aria-label="Global routes">
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

      <section
        className="global-sidebar__supplement grid gap-[0.55rem] rounded-[1.05rem] border border-[color:var(--border-subtle)] px-[1.05rem] py-4"
        style={globalSidebarSupplementStyle}
        aria-labelledby="global-sidebar-recent"
      >
        <p
          id="global-sidebar-recent"
          className="global-sidebar__supplement-label m-0 text-[0.76rem] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]"
        >
          Recent workspaces
        </p>
        <p className="global-sidebar__supplement-copy m-0 text-[0.9rem] text-[color:var(--color-text-secondary)]">
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
