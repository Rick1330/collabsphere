"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  WorkspaceApiError,
  listWorkspaces,
  workspaceListQueryKey,
  type WorkspaceRole,
  type WorkspaceSummary,
} from "../../lib/api/workspaces";
import {
  getWorkspaceInitials,
  getWorkspaceRoleGateLabel,
  isWorkspaceRoleAllowed,
  isWorkspaceSidebarItemActive,
  workspaceSidebarPrimaryItems,
  workspaceSidebarQuickActionItems,
  workspaceSidebarSecondaryItems,
  type WorkspaceSidebarItem,
} from "./navigation";

type SidebarCollapseProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  sidebarId?: string;
};

type WorkspaceSidebarDataState =
  | { kind: "loading" }
  | { kind: "loaded"; workspace: WorkspaceSummary }
  | { kind: "missing" }
  | { kind: "error"; message: string; requestId: string | null };

type WorkspaceSidebarViewProps = SidebarCollapseProps & {
  currentPathname: string | null;
  dataState: WorkspaceSidebarDataState;
  workspaceId: string;
};

type WorkspaceSidebarSectionProps = {
  collapsed: boolean;
  currentPathname: string | null;
  currentRole: WorkspaceRole | null;
  items: readonly WorkspaceSidebarItem[];
  label: string;
  sectionId: string;
};

type WorkspaceSidebarItemState = {
  gateLabel: string;
  gateMeta: string;
  hasAccess: boolean;
  isActive: boolean;
  isLiveLink: boolean;
};

type WorkspaceSidebarStatusState = {
  title: string;
  copy: string;
  requestId?: string | null;
};

type WorkspaceSidebarPresentation = {
  currentRole: WorkspaceRole | null;
  description: string;
  mark: string;
  roleLabel: string | null;
  status: WorkspaceSidebarStatusState | null;
  title: string;
};

const getWorkspaceSidebarDataState = ({
  error,
  workspaces,
  workspaceId,
  pending,
}: {
  error: WorkspaceApiError | null;
  workspaces: WorkspaceSummary[] | undefined;
  workspaceId: string;
  pending: boolean;
}): WorkspaceSidebarDataState => {
  if (pending && workspaces == null) {
    return { kind: "loading" };
  }

  if (Array.isArray(workspaces)) {
    const workspace = workspaces.find((item) => item.id === workspaceId);

    if (workspace) {
      return { kind: "loaded", workspace };
    }

    return { kind: "missing" };
  }

  if (error) {
    return {
      kind: "error",
      message: error.message,
      requestId: error.requestId,
    };
  }

  return { kind: "missing" };
};

const coerceWorkspaceSidebarError = (error: unknown) => {
  if (error instanceof WorkspaceApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new WorkspaceApiError(
      "unknown",
      "The workspace membership context could not be confirmed.",
    );
  }

  return null;
};

const isItemAccessible = (
  currentRole: WorkspaceRole | null,
  item: WorkspaceSidebarItem,
) => {
  if (item.requiredRole == null || currentRole == null) {
    return item.requiredRole == null;
  }

  return isWorkspaceRoleAllowed(currentRole, item.requiredRole);
};

const getWorkspaceSidebarItemState = ({
  currentPathname,
  currentRole,
  item,
}: {
  currentPathname: string | null;
  currentRole: WorkspaceRole | null;
  item: WorkspaceSidebarItem;
}): WorkspaceSidebarItemState => {
  const isActive = isWorkspaceSidebarItemActive(currentPathname, item);
  const hasAccess = isItemAccessible(currentRole, item);
  const isLiveLink = item.status !== "staged" && hasAccess;

  if (isLiveLink) {
    return {
      gateLabel: "",
      gateMeta: "",
      hasAccess,
      isActive,
      isLiveLink,
    };
  }

  const gateLabel =
    item.requiredRole == null
      ? "Staged"
      : hasAccess
        ? "Soon"
        : getWorkspaceRoleGateLabel(item.requiredRole);

  const gateMeta =
    item.requiredRole == null
      ? "Route foundation is staged in a later baton."
      : hasAccess
        ? "Your role allows this route, but the page is not implemented yet."
        : `${gateLabel} access is required before this route becomes available.`;

  return {
    gateLabel,
    gateMeta,
    hasAccess,
    isActive,
    isLiveLink,
  };
};

const getWorkspaceSidebarPresentation = (
  dataState: WorkspaceSidebarDataState,
  workspaceId: string,
): WorkspaceSidebarPresentation => {
  if (dataState.kind === "loaded") {
    return {
      currentRole: dataState.workspace.myRole,
      title: dataState.workspace.name,
      description:
        dataState.workspace.description ??
        "Workspace-scoped routes now live under a dedicated navigation boundary.",
      mark: getWorkspaceInitials(dataState.workspace),
      roleLabel: dataState.workspace.roleLabel,
      status: null,
    };
  }

  if (dataState.kind === "loading") {
    return {
      currentRole: null,
      title: `Workspace ${workspaceId}`,
      description: "Workspace navigation remains available while membership context is loading.",
      mark: "WS",
      roleLabel: null,
      status: {
        title: "Checking workspace membership",
        copy: "Role-gated routes stay locked until the current workspace context resolves.",
      },
    };
  }

  if (dataState.kind === "error") {
    return {
      currentRole: null,
      title: `Workspace ${workspaceId}`,
      description: "Workspace navigation remains available while membership context is loading.",
      mark: "WS",
      roleLabel: null,
      status: {
        title: "Workspace context unavailable",
        copy: dataState.message,
        requestId: dataState.requestId,
      },
    };
  }

  return {
    currentRole: null,
    title: `Workspace ${workspaceId}`,
    description: "Workspace navigation remains available while membership context is loading.",
    mark: "WS",
    roleLabel: null,
    status: {
      title: "Workspace membership not confirmed",
      copy:
        "The current workspace was not present in the active member workspace list, so elevated routes remain locked.",
    },
  };
};

function WorkspaceSidebarStatus({
  status,
}: Readonly<{ status: WorkspaceSidebarStatusState }>) {
  return (
    <div className="workspace-sidebar__status" role="status" aria-live="polite">
      <strong className="workspace-sidebar__status-title">{status.title}</strong>
      <p className="workspace-sidebar__status-copy">{status.copy}</p>
      {status.requestId ? (
        <p className="workspace-sidebar__status-meta">Request ID: {status.requestId}</p>
      ) : null}
    </div>
  );
}

function WorkspaceSidebarLinkContent({
  description,
  gateLabel,
  label,
  meta,
}: Readonly<{
  description: string;
  gateLabel?: string;
  label: string;
  meta?: string;
}>) {
  if (gateLabel) {
    return (
      <span className="workspace-sidebar__link-copy">
        <span className="workspace-sidebar__link-label-row">
          <span className="workspace-sidebar__link-label">{label}</span>
          <span className="workspace-sidebar__gate-tag">{gateLabel}</span>
        </span>
        <span className="workspace-sidebar__link-description">{meta}</span>
      </span>
    );
  }

  return (
    <span className="workspace-sidebar__link-copy">
      <span className="workspace-sidebar__link-label">{label}</span>
      <span className="workspace-sidebar__link-description">{description}</span>
    </span>
  );
}

function WorkspaceSidebarItemRow({
  collapsed,
  currentPathname,
  currentRole,
  item,
}: Readonly<{
  collapsed: boolean;
  currentPathname: string | null;
  currentRole: WorkspaceRole | null;
  item: WorkspaceSidebarItem;
}>) {
  const itemState = getWorkspaceSidebarItemState({
    currentPathname,
    currentRole,
    item,
  });

  if (itemState.isLiveLink) {
    return (
      <li className="shell__nav-item">
        <Link
          className="shell__nav-link workspace-sidebar__link"
          data-active={itemState.isActive}
          aria-current={itemState.isActive ? "page" : undefined}
          aria-label={collapsed ? item.label : undefined}
          href={item.href}
          title={collapsed ? item.label : undefined}
        >
          <span className="workspace-sidebar__link-mark" aria-hidden="true">
            {item.mark}
          </span>
          <WorkspaceSidebarLinkContent
            description={item.description}
            label={item.label}
          />
        </Link>
      </li>
    );
  }

  const ariaLabel = itemState.hasAccess
    ? `${item.label}. Route staged.`
    : `${item.label}. ${itemState.gateLabel} required.`;

  return (
    <li className="shell__nav-item">
      <div
        className="workspace-sidebar__locked"
        data-locked={!itemState.hasAccess}
        aria-label={ariaLabel}
        title={collapsed ? ariaLabel : undefined}
      >
        <span className="workspace-sidebar__link-mark" aria-hidden="true">
          {itemState.hasAccess ? item.mark : "🔒"}
        </span>
        <WorkspaceSidebarLinkContent
          description={item.description}
          gateLabel={itemState.gateLabel}
          label={item.label}
          meta={itemState.gateMeta}
        />
      </div>
    </li>
  );
}

function WorkspaceSidebarSection({
  collapsed,
  currentPathname,
  currentRole,
  items,
  label,
  sectionId,
}: Readonly<WorkspaceSidebarSectionProps>) {
  return (
    <section
      className="workspace-sidebar__section"
      aria-labelledby={`workspace-sidebar-${sectionId}`}
    >
      <p id={`workspace-sidebar-${sectionId}`} className="workspace-sidebar__section-label">
        {label}
      </p>
      <ul className="shell__nav-list workspace-sidebar__list">
        {items.map((item) => (
          <WorkspaceSidebarItemRow
            key={item.href}
            collapsed={collapsed}
            currentPathname={currentPathname}
            currentRole={currentRole}
            item={item}
          />
        ))}
      </ul>
    </section>
  );
}

export function WorkspaceSidebarView({
  collapsed = false,
  currentPathname,
  dataState,
  onToggleCollapse,
  sidebarId,
  workspaceId,
}: Readonly<WorkspaceSidebarViewProps>) {
  const presentation = getWorkspaceSidebarPresentation(dataState, workspaceId);
  const sections = [
    {
      items: workspaceSidebarPrimaryItems(workspaceId),
      label: "Workspace",
      sectionId: "workspace",
    },
    {
      items: workspaceSidebarSecondaryItems(workspaceId),
      label: "Elevated routes",
      sectionId: "elevated-routes",
    },
    {
      items: workspaceSidebarQuickActionItems(workspaceId),
      label: "Quick actions",
      sectionId: "quick-actions",
    },
  ] as const;

  return (
    <aside
      id={sidebarId}
      className="shell__rail workspace-sidebar"
      aria-label="Workspace navigation"
      data-collapsed={collapsed}
    >
      {onToggleCollapse ? (
        <button
          type="button"
          className="sidebar-collapse-toggle"
          aria-controls={sidebarId}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
        >
          <span aria-hidden="true">{collapsed ? ">" : "<"}</span>
        </button>
      ) : null}
      <div className="workspace-sidebar__header">
        <Link
          className="workspace-sidebar__back-link"
          aria-label={collapsed ? "Back to dashboard" : undefined}
          href="/dashboard"
          title={collapsed ? "Back to dashboard" : undefined}
        >
          <span aria-hidden="true">←</span>
          <span>Back to dashboard</span>
        </Link>
        <div className="workspace-sidebar__identity">
          <span className="workspace-sidebar__identity-mark" aria-hidden="true">
            {presentation.mark}
          </span>
          <div className="workspace-sidebar__identity-copy">
            <p className="workspace-sidebar__title">{presentation.title}</p>
            <p className="workspace-sidebar__description">{presentation.description}</p>
          </div>
          {presentation.roleLabel ? (
            <span className="workspace-sidebar__role-badge">
              {presentation.roleLabel}
            </span>
          ) : null}
        </div>
      </div>

      {presentation.status ? <WorkspaceSidebarStatus status={presentation.status} /> : null}

      <nav className="workspace-sidebar__nav" aria-label="Workspace route groups">
        {sections.map((section) => (
          <WorkspaceSidebarSection
            key={section.label}
            collapsed={collapsed}
            currentPathname={currentPathname}
            currentRole={presentation.currentRole}
            items={section.items}
            label={section.label}
            sectionId={section.sectionId}
          />
        ))}
      </nav>
    </aside>
  );
}

export function WorkspaceSidebar({
  collapsed = false,
  onToggleCollapse,
  sidebarId,
  workspaceId,
  pathnameOverride,
}: Readonly<
  SidebarCollapseProps & {
    workspaceId: string;
    pathnameOverride?: string;
  }
>) {
  const pathnameFromRouter = usePathname();
  const pathname = pathnameOverride ?? pathnameFromRouter;
  const query = useQuery({
    queryKey: workspaceListQueryKey,
    queryFn: ({ signal }) => listWorkspaces({ signal }),
    retry: false,
    staleTime: 60_000,
  });

  const dataState = getWorkspaceSidebarDataState({
    error: coerceWorkspaceSidebarError(query.error),
    workspaces: query.data,
    workspaceId,
    pending: query.isPending,
  });

  return (
    <WorkspaceSidebarView
      collapsed={collapsed}
      currentPathname={pathname}
      dataState={dataState}
      onToggleCollapse={onToggleCollapse}
      sidebarId={sidebarId}
      workspaceId={workspaceId}
    />
  );
}
