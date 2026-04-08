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

type WorkspaceSidebarDataState =
  | { kind: "loading" }
  | { kind: "loaded"; workspace: WorkspaceSummary }
  | { kind: "missing" }
  | { kind: "error"; message: string; requestId: string | null };

type WorkspaceSidebarViewProps = {
  currentPathname: string | null;
  dataState: WorkspaceSidebarDataState;
  workspaceId: string;
};

type WorkspaceSidebarSectionProps = {
  currentPathname: string | null;
  currentRole: WorkspaceRole | null;
  items: readonly WorkspaceSidebarItem[];
  label: string;
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

function WorkspaceSidebarSection({
  currentPathname,
  currentRole,
  items,
  label,
}: Readonly<WorkspaceSidebarSectionProps>) {
  return (
    <section className="workspace-sidebar__section" aria-labelledby={`workspace-sidebar-${label}`}>
      <p id={`workspace-sidebar-${label}`} className="workspace-sidebar__section-label">
        {label}
      </p>
      <ul className="shell__nav-list workspace-sidebar__list">
        {items.map((item) => {
          const isActive = isWorkspaceSidebarItemActive(currentPathname, item);
          const hasAccess = isItemAccessible(currentRole, item);
          const isLiveLink = item.status !== "staged" && hasAccess;

          if (isLiveLink) {
            return (
              <li key={item.href} className="shell__nav-item">
                <Link
                  className="shell__nav-link workspace-sidebar__link"
                  data-active={isActive}
                  aria-current={isActive ? "page" : undefined}
                  href={item.href}
                >
                  <span className="workspace-sidebar__link-mark" aria-hidden="true">
                    {item.mark}
                  </span>
                  <span className="workspace-sidebar__link-copy">
                    <span className="workspace-sidebar__link-label">{item.label}</span>
                    <span className="workspace-sidebar__link-description">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
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

          return (
            <li key={item.href} className="shell__nav-item">
              <div
                className="workspace-sidebar__locked"
                data-locked={!hasAccess}
                aria-label={
                  hasAccess
                    ? `${item.label}. Route staged.`
                    : `${item.label}. ${gateLabel} required.`
                }
              >
                <span className="workspace-sidebar__link-mark" aria-hidden="true">
                  {hasAccess ? item.mark : "🔒"}
                </span>
                <span className="workspace-sidebar__link-copy">
                  <span className="workspace-sidebar__link-label-row">
                    <span className="workspace-sidebar__link-label">{item.label}</span>
                    <span className="workspace-sidebar__gate-tag">{gateLabel}</span>
                  </span>
                  <span className="workspace-sidebar__link-description">{gateMeta}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function WorkspaceSidebarView({
  currentPathname,
  dataState,
  workspaceId,
}: Readonly<WorkspaceSidebarViewProps>) {
  const currentRole =
    dataState.kind === "loaded" ? dataState.workspace.myRole : null;

  const title =
    dataState.kind === "loaded"
      ? dataState.workspace.name
      : `Workspace ${workspaceId}`;
  const description =
    dataState.kind === "loaded"
      ? dataState.workspace.description ??
        "Workspace-scoped routes now live under a dedicated navigation boundary."
      : "Workspace navigation remains available while membership context is loading.";
  const mark =
    dataState.kind === "loaded"
      ? getWorkspaceInitials(dataState.workspace)
      : "WS";

  return (
    <aside className="shell__rail workspace-sidebar" aria-label="Workspace navigation">
      <div className="workspace-sidebar__header">
        <Link className="workspace-sidebar__back-link" href="/dashboard">
          <span aria-hidden="true">←</span>
          <span>Back to dashboard</span>
        </Link>
        <div className="workspace-sidebar__identity">
          <span className="workspace-sidebar__identity-mark" aria-hidden="true">
            {mark}
          </span>
          <div className="workspace-sidebar__identity-copy">
            <p className="workspace-sidebar__title">{title}</p>
            <p className="workspace-sidebar__description">{description}</p>
          </div>
          {dataState.kind === "loaded" ? (
            <span className="workspace-sidebar__role-badge">
              {dataState.workspace.roleLabel}
            </span>
          ) : null}
        </div>
      </div>

      {dataState.kind === "loading" ? (
        <div className="workspace-sidebar__status" role="status" aria-live="polite">
          <strong className="workspace-sidebar__status-title">
            Checking workspace membership
          </strong>
          <p className="workspace-sidebar__status-copy">
            Role-gated routes stay locked until the current workspace context resolves.
          </p>
        </div>
      ) : null}

      {dataState.kind === "error" ? (
        <div className="workspace-sidebar__status" role="status" aria-live="polite">
          <strong className="workspace-sidebar__status-title">
            Workspace context unavailable
          </strong>
          <p className="workspace-sidebar__status-copy">{dataState.message}</p>
          {dataState.requestId ? (
            <p className="workspace-sidebar__status-meta">
              Request ID: {dataState.requestId}
            </p>
          ) : null}
        </div>
      ) : null}

      {dataState.kind === "missing" ? (
        <div className="workspace-sidebar__status" role="status" aria-live="polite">
          <strong className="workspace-sidebar__status-title">
            Workspace membership not confirmed
          </strong>
          <p className="workspace-sidebar__status-copy">
            The current workspace was not present in the active member workspace list, so
            elevated routes remain locked.
          </p>
        </div>
      ) : null}

      <nav className="workspace-sidebar__nav" aria-label="Workspace route groups">
        <WorkspaceSidebarSection
          currentPathname={currentPathname}
          currentRole={currentRole}
          items={workspaceSidebarPrimaryItems(workspaceId)}
          label="Workspace"
        />
        <WorkspaceSidebarSection
          currentPathname={currentPathname}
          currentRole={currentRole}
          items={workspaceSidebarSecondaryItems(workspaceId)}
          label="Elevated routes"
        />
        <WorkspaceSidebarSection
          currentPathname={currentPathname}
          currentRole={currentRole}
          items={workspaceSidebarQuickActionItems(workspaceId)}
          label="Quick actions"
        />
      </nav>
    </aside>
  );
}

export function WorkspaceSidebar({
  workspaceId,
  pathnameOverride,
}: Readonly<{ workspaceId: string; pathnameOverride?: string }>) {
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
      currentPathname={pathname}
      dataState={dataState}
      workspaceId={workspaceId}
    />
  );
}
