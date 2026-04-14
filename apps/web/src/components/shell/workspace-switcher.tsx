"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@collabsphere/ui/components/dropdown-menu";

import {
  WorkspaceApiError,
  listWorkspaces,
  workspaceListQueryKey,
  type WorkspaceSummary,
} from "../../lib/api/workspaces";

export type WorkspaceSwitcherDataState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string; requestId: string | null }
  | { kind: "loaded"; workspaces: WorkspaceSummary[] };

type WorkspaceSwitcherAction =
  | {
      kind: "workspace";
      key: string;
      workspace: WorkspaceSummary;
      current: boolean;
    }
  | {
      kind: "retry";
      key: typeof retryWorkspaceActionKey;
      label: string;
      description: string;
    }
  | {
      kind: "create";
      key: typeof createWorkspaceActionKey;
      label: string;
      description: string;
    };

export type WorkspaceSwitcherMenuProps = {
  currentWorkspaceId: string | null;
  dataState: WorkspaceSwitcherDataState;
  initialOpen?: boolean;
  onRetry?: () => void;
  onSelectWorkspace?: (workspaceId: string) => void;
  onCreateWorkspace?: () => void;
};

type WorkspaceSwitcherProps = {
  initialOpen?: boolean;
  pathnameOverride?: string;
  stateOverride?: WorkspaceSwitcherDataState;
};

type WorkspaceMenuOpenKey = "Enter" | " " | "ArrowDown" | "ArrowUp";
type WorkspaceMenuNavigationKey =
  | "ArrowDown"
  | "ArrowUp"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown";

const createWorkspaceActionKey = "action:create";
const retryWorkspaceActionKey = "action:retry";

const workspaceSwitcherTriggerStyle = {
  borderColor: `color-mix(in srgb, var(--color-border) 78%, var(--section-accent, var(--color-accent)) 22%)`,
  background: `linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-card) 94%, var(--color-bg-secondary)) 0%,
    color-mix(in srgb, var(--surface-card-subtle) 88%, var(--section-accent, var(--color-accent))) 100%
  )`,
  boxShadow: "var(--shadow-soft)",
} satisfies React.CSSProperties;

const workspaceSwitcherMarkStyle = {
  background: `linear-gradient(
    135deg,
    color-mix(in srgb, var(--section-accent, var(--color-accent)) 80%, white),
    color-mix(in srgb, var(--section-accent, var(--color-accent)) 24%, transparent)
  )`,
  boxShadow: `inset 0 1px 0 color-mix(in srgb, white 30%, transparent), 0 0 0 1px color-mix(in srgb, var(--section-accent, var(--color-accent)) 24%, transparent)`,
} satisfies React.CSSProperties;

const workspaceSwitcherPanelStyle = {
  borderColor: `color-mix(in srgb, var(--color-border) 80%, var(--section-accent, var(--color-accent)) 20%)`,
  background: `linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-card) 96%, var(--color-bg-secondary)) 0%,
    color-mix(in srgb, var(--surface-card-subtle) 92%, var(--section-accent, var(--color-accent))) 100%
  )`,
  boxShadow: "var(--shadow-elevated)",
} satisfies React.CSSProperties;

const workspaceSwitcherStateStyle = {
  background: "var(--surface-card)",
} satisfies React.CSSProperties;

const workspaceSwitcherItemBadgeStyle = {
  background: `color-mix(in srgb, var(--section-accent, var(--color-accent)) 16%, var(--surface-card))`,
} satisfies React.CSSProperties;

const workspaceMenuNavigationKeys = new Set<WorkspaceMenuNavigationKey>([
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

const workspaceTypeLabels: Record<WorkspaceSummary["type"], string> = {
  academic: "Academic",
  general: "General",
  professional: "Professional",
};

const getDefaultActiveIndex = (currentWorkspaceIndex: number) =>
  currentWorkspaceIndex >= 0 ? currentWorkspaceIndex : 0;

export const getClampedWorkspaceMenuIndex = (currentIndex: number, itemCount: number) => {
  if (itemCount <= 0) {
    return -1;
  }

  if (currentIndex < 0) {
    return 0;
  }

  if (currentIndex >= itemCount) {
    return itemCount - 1;
  }

  return currentIndex;
};

export const isWorkspaceMenuOpenKey = (key: string): key is WorkspaceMenuOpenKey =>
  key === "Enter" || key === " " || key === "ArrowDown" || key === "ArrowUp";

export const isWorkspaceMenuNavigationKey = (key: string): key is WorkspaceMenuNavigationKey =>
  workspaceMenuNavigationKeys.has(key as WorkspaceMenuNavigationKey);

export const getWorkspaceMenuNextIndex = (
  currentIndex: number,
  key: WorkspaceMenuNavigationKey,
  itemCount: number,
) => {
  if (itemCount <= 0) {
    return -1;
  }

  if (key === "Home" || key === "PageUp") {
    return 0;
  }

  if (key === "End" || key === "PageDown") {
    return itemCount - 1;
  }

  if (key === "ArrowUp") {
    return currentIndex <= 0 ? itemCount - 1 : currentIndex - 1;
  }

  return currentIndex >= itemCount - 1 ? 0 : currentIndex + 1;
};

export const getWorkspaceMenuOpenIndex = (
  key: WorkspaceMenuOpenKey,
  currentWorkspaceIndex: number,
  itemCount: number,
) => {
  if (itemCount <= 0) {
    return -1;
  }

  if (key === "ArrowUp") {
    return itemCount - 1;
  }

  return currentWorkspaceIndex >= 0 ? currentWorkspaceIndex : 0;
};

export const getCurrentWorkspaceIdFromPathname = (pathname: string | null | undefined) => {
  if (!pathname || !pathname.startsWith("/w/")) {
    return null;
  }

  const [, , workspaceId] = pathname.split("/");

  return workspaceId || null;
};

const getWorkspaceInitials = (workspace: Pick<WorkspaceSummary, "icon" | "name">) => {
  if (workspace.icon) {
    return workspace.icon;
  }

  const initials = workspace.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "WS";
};

const getWorkspaceMeta = (workspace: WorkspaceSummary) =>
  `${workspace.roleLabel} · ${workspaceTypeLabels[workspace.type]}`;

const getWorkspaceContextLabel = (currentWorkspaceId: string | null, fallbackLabel: string) =>
  currentWorkspaceId ? "Current workspace" : fallbackLabel;

const createWorkspaceAction = (description: string): WorkspaceSwitcherAction => ({
  kind: "create",
  key: createWorkspaceActionKey,
  label: "Create workspace",
  description,
});

const retryWorkspaceAction = (): WorkspaceSwitcherAction => ({
  kind: "retry",
  key: retryWorkspaceActionKey,
  label: "Retry workspace list",
  description: "Retry the current workspace request without leaving the page.",
});

const getLoadedWorkspaceTriggerCopy = (
  workspaces: WorkspaceSummary[],
  currentWorkspaceId: string | null,
) => {
  const currentWorkspace =
    currentWorkspaceId == null
      ? null
      : workspaces.find((workspace) => workspace.id === currentWorkspaceId) ?? null;

  if (!currentWorkspace) {
    return {
      icon: "WS",
      label: "Select Workspace",
      meta: `${workspaces.length} member workspaces`,
    };
  }

  return {
    icon: getWorkspaceInitials(currentWorkspace),
    label: currentWorkspace.name,
    meta: `Current workspace · ${currentWorkspace.roleLabel}`,
  };
};

export const getWorkspaceTriggerCopy = (
  dataState: WorkspaceSwitcherDataState,
  currentWorkspaceId: string | null,
) => {
  if (dataState.kind === "loaded") {
    return getLoadedWorkspaceTriggerCopy(dataState.workspaces, currentWorkspaceId);
  }

  if (dataState.kind === "loading") {
    return {
      icon: "WS",
      label: getWorkspaceContextLabel(currentWorkspaceId, "Loading workspaces"),
      meta: "Fetching member contexts",
    };
  }

  if (dataState.kind === "error") {
    return {
      icon: "WS",
      label: getWorkspaceContextLabel(currentWorkspaceId, "Select Workspace"),
      meta: "Workspace list unavailable",
    };
  }

  return {
    icon: "WS",
    label: "Select Workspace",
    meta: "Create or join a workspace",
  };
};

export const getWorkspaceSwitcherDataState = ({
  error,
  workspaces,
  pending,
}: {
  error: WorkspaceApiError | null;
  workspaces: WorkspaceSummary[] | undefined;
  pending: boolean;
}): WorkspaceSwitcherDataState => {
  const hasWorkspaceData = Array.isArray(workspaces);

  if (pending && !hasWorkspaceData) {
    return { kind: "loading" };
  }

  if (hasWorkspaceData) {
    if (workspaces.length === 0) {
      return { kind: "empty" };
    }

    return {
      kind: "loaded",
      workspaces,
    };
  }

  if (error) {
    return {
      kind: "error",
      message: error.message,
      requestId: error.requestId,
    };
  }

  return { kind: "empty" };
};

const coerceWorkspaceQueryError = (error: unknown) => {
  if (error instanceof WorkspaceApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new WorkspaceApiError(
      "unknown",
      "The workspace list request could not be completed.",
    );
  }

  return null;
};

const getWorkspaceSwitcherActions = (
  dataState: WorkspaceSwitcherDataState,
  currentWorkspaceId: string | null,
): WorkspaceSwitcherAction[] => {
  if (dataState.kind === "loaded") {
    return [
      ...dataState.workspaces.map((workspace) => ({
        kind: "workspace" as const,
        key: `workspace:${workspace.id}`,
        workspace,
        current: workspace.id === currentWorkspaceId,
      })),
      createWorkspaceAction("Open the workspace creation flow."),
    ];
  }

  if (dataState.kind === "error") {
    return [
      retryWorkspaceAction(),
      createWorkspaceAction("Start a new workspace while the list service recovers."),
    ];
  }

  if (dataState.kind === "empty") {
    return [createWorkspaceAction("Set up the first workspace for this account.")];
  }

  return [createWorkspaceAction("Start a new workspace while member contexts load.")];
};

const LoadingWorkspaceSkeleton = () => (
  <div className="workspace-switcher__skeleton-list grid gap-[0.7rem]" aria-hidden="true">
    {Array.from({ length: 3 }, (_, index) => (
      <div
        key={`workspace-skeleton-${index}`}
        className="workspace-switcher__skeleton-row grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3"
      >
        <span className="workspace-switcher__skeleton-mark h-[2.45rem] w-[2.45rem] rounded-full bg-[var(--surface-card-muted)]" />
        <span className="workspace-switcher__skeleton-copy grid gap-[0.35rem]">
          <span className="workspace-switcher__skeleton-line workspace-switcher__skeleton-line--primary block h-[0.7rem] w-[58%] rounded-full bg-[var(--surface-card-muted)]" />
          <span className="workspace-switcher__skeleton-line workspace-switcher__skeleton-line--secondary block h-[0.7rem] w-[76%] rounded-full bg-[var(--surface-card-muted)]" />
        </span>
      </div>
    ))}
  </div>
);

export function WorkspaceSwitcherMenu({
  currentWorkspaceId,
  dataState,
  initialOpen = false,
  onRetry,
  onSelectWorkspace,
  onCreateWorkspace,
}: Readonly<WorkspaceSwitcherMenuProps>) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const actions = getWorkspaceSwitcherActions(dataState, currentWorkspaceId);
  const currentWorkspaceIndex = actions.findIndex(
    (action) => action.kind === "workspace" && action.current,
  );
  const [openIndex, setOpenIndex] = useState(() =>
    getDefaultActiveIndex(currentWorkspaceIndex),
  );
  const triggerCopy = getWorkspaceTriggerCopy(dataState, currentWorkspaceId);

  useEffect(() => {
    setOpenIndex((currentIndex) =>
      getClampedWorkspaceMenuIndex(currentIndex, actions.length),
    );
  }, [actions.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    itemRefs.current[openIndex]?.focus();
  }, [isOpen, openIndex]);

  const openMenu = (nextIndex = getDefaultActiveIndex(currentWorkspaceIndex)) => {
    setOpenIndex(getClampedWorkspaceMenuIndex(nextIndex, actions.length));
    setIsOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  };

  const handleActionSelect = (action: WorkspaceSwitcherAction) => {
    if (action.kind === "workspace") {
      onSelectWorkspace?.(action.workspace.id);
      closeMenu();
      return;
    }

    if (action.kind === "retry") {
      onRetry?.();
      closeMenu(true);
      return;
    }

    onCreateWorkspace?.();
    closeMenu(true);
  };

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <div className="workspace-switcher relative">
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            id={`${menuId}-trigger`}
            type="button"
            className="workspace-switcher__trigger grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.15rem] border px-[0.9rem] py-[0.8rem] text-left"
            style={workspaceSwitcherTriggerStyle}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => {
              if (isOpen) {
                closeMenu(true);
                return;
              }

              openMenu(getDefaultActiveIndex(currentWorkspaceIndex));
            }}
            onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => {
              if (!isWorkspaceMenuOpenKey(event.key)) {
                return;
              }

              event.preventDefault();
              openMenu(getWorkspaceMenuOpenIndex(event.key, currentWorkspaceIndex, actions.length));
            }}
          >
            <span
              className="workspace-switcher__trigger-mark inline-grid h-[2.45rem] w-[2.45rem] place-items-center rounded-full text-[0.84rem] font-extrabold tracking-[0.06em] text-[color:var(--color-bg-primary)]"
              style={workspaceSwitcherMarkStyle}
              aria-hidden="true"
            >
              {triggerCopy.icon}
            </span>
            <span className="workspace-switcher__trigger-copy grid min-w-0 gap-[0.16rem]">
              <span className="workspace-switcher__trigger-label text-[0.98rem] font-bold text-[color:var(--color-text-primary)]">
                {triggerCopy.label}
              </span>
              <span className="workspace-switcher__trigger-meta text-[0.86rem] text-[color:var(--color-text-secondary)]">
                {triggerCopy.meta}
              </span>
            </span>
            <span
              className="workspace-switcher__trigger-caret text-[0.88rem] text-[color:var(--color-text-tertiary)]"
              aria-hidden="true"
            >
              {isOpen ? "▴" : "▾"}
            </span>
          </button>
        </DropdownMenuTrigger>

        {isOpen ? (
          <DropdownMenuContent
            id={menuId}
            className="workspace-switcher__panel z-[8] max-h-[min(32rem,calc(100vh-6rem))] w-[min(28rem,calc(100vw-3rem))] overflow-y-auto rounded-[1.35rem] border p-4"
            style={workspaceSwitcherPanelStyle}
            align="start"
            sideOffset={12}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              triggerRef.current?.focus();
            }}
          >
            <div className="workspace-switcher__panel-header mb-[0.85rem] grid gap-[0.28rem]">
              <p className="workspace-switcher__panel-eyebrow m-0 text-[0.76rem] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
                Workspace switcher
              </p>
              <p className="workspace-switcher__panel-title m-0 text-[0.98rem] font-bold text-[color:var(--color-text-primary)]">
                {currentWorkspaceId ? "Switch workspace context" : "Select Workspace"}
              </p>
            </div>

            {dataState.kind === "loading" ? (
              <div
                className="workspace-switcher__state workspace-switcher__state--loading mb-[0.85rem] grid gap-2 rounded-[1rem] border border-[color:var(--border-subtle)] px-4 py-[0.95rem]"
                style={workspaceSwitcherStateStyle}
                role="status"
                aria-live="polite"
              >
                <LoadingWorkspaceSkeleton />
                <p className="workspace-switcher__state-copy m-0 text-[0.86rem] text-[color:var(--color-text-secondary)]">
                  Loading member workspaces.
                </p>
              </div>
            ) : null}

            {dataState.kind === "empty" ? (
              <div
                className="workspace-switcher__state workspace-switcher__state--empty mb-[0.85rem] grid gap-2 rounded-[1rem] border border-[color:var(--border-subtle)] px-4 py-[0.95rem]"
                style={workspaceSwitcherStateStyle}
                role="status"
                aria-live="polite"
              >
                <strong className="workspace-switcher__state-title m-0 text-[0.98rem] font-bold text-[color:var(--color-text-primary)]">
                  No workspaces yet
                </strong>
                <p className="workspace-switcher__state-copy m-0 text-[0.86rem] text-[color:var(--color-text-secondary)]">
                  Create your first workspace or join one through an invitation.
                </p>
              </div>
            ) : null}

            {dataState.kind === "error" ? (
              <div
                className="workspace-switcher__state workspace-switcher__state--error mb-[0.85rem] grid gap-2 rounded-[1rem] border border-[color:var(--border-subtle)] px-4 py-[0.95rem]"
                style={workspaceSwitcherStateStyle}
                role="status"
                aria-live="polite"
              >
                <strong className="workspace-switcher__state-title m-0 text-[0.98rem] font-bold text-[color:var(--color-text-primary)]">
                  Workspace list unavailable
                </strong>
                <p className="workspace-switcher__state-copy m-0 text-[0.86rem] text-[color:var(--color-text-secondary)]">
                  {dataState.message}
                </p>
                {dataState.requestId ? (
                  <p className="workspace-switcher__state-meta m-0 text-[0.86rem] text-[color:var(--color-text-secondary)]">
                    Request ID: {dataState.requestId}
                  </p>
                ) : null}
              </div>
            ) : null}

            <DropdownMenuGroup className="workspace-switcher__menu grid gap-[0.55rem]">
              {actions.map((action, index) => {
                const isCurrent = action.kind === "workspace" && action.current;

                return (
                  <DropdownMenuItem
                    key={action.key}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    className="workspace-switcher__item grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[1rem] border border-[color:var(--border-subtle)] bg-[var(--surface-card)] px-[0.95rem] py-[0.9rem] text-left"
                    data-current={isCurrent || undefined}
                    aria-current={isCurrent ? "page" : undefined}
                    aria-label={
                      action.kind === "workspace" && action.current
                        ? `${action.workspace.name}, current workspace`
                        : undefined
                    }
                    onSelect={(event) => {
                      event.preventDefault();
                      handleActionSelect(action);
                    }}
                  >
                    {action.kind === "workspace" ? (
                      <>
                        <span
                          className="workspace-switcher__item-mark inline-grid h-[2.45rem] w-[2.45rem] place-items-center rounded-full text-[0.84rem] font-extrabold tracking-[0.06em] text-[color:var(--color-bg-primary)]"
                          style={workspaceSwitcherMarkStyle}
                          aria-hidden="true"
                        >
                          {getWorkspaceInitials(action.workspace)}
                        </span>
                        <span className="workspace-switcher__item-copy grid min-w-0 gap-[0.16rem]">
                          <span className="workspace-switcher__item-label-row flex min-w-0 items-center gap-[0.55rem]">
                            <span className="workspace-switcher__item-label text-[0.98rem] font-bold text-[color:var(--color-text-primary)]">
                              {action.workspace.name}
                            </span>
                            {action.current ? (
                              <span
                                className="workspace-switcher__item-badge rounded-full px-[0.48rem] py-[0.18rem] text-[0.74rem] font-bold whitespace-nowrap text-[color:var(--color-text-secondary)]"
                                style={workspaceSwitcherItemBadgeStyle}
                              >
                                Current
                              </span>
                            ) : null}
                          </span>
                          <span className="workspace-switcher__item-description text-[0.86rem] text-[color:var(--color-text-secondary)]">
                            {getWorkspaceMeta(action.workspace)}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className="workspace-switcher__item-mark inline-grid h-[2.45rem] w-[2.45rem] place-items-center rounded-full text-[0.84rem] font-extrabold tracking-[0.06em] text-[color:var(--color-bg-primary)]"
                          style={workspaceSwitcherMarkStyle}
                          aria-hidden="true"
                        >
                          {action.kind === "retry" ? "↺" : "+"}
                        </span>
                        <span className="workspace-switcher__item-copy grid min-w-0 gap-[0.16rem]">
                          <span className="workspace-switcher__item-label text-[0.98rem] font-bold text-[color:var(--color-text-primary)]">
                            {action.label}
                          </span>
                          <span className="workspace-switcher__item-description text-[0.86rem] text-[color:var(--color-text-secondary)]">
                            {action.description}
                          </span>
                        </span>
                      </>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        ) : null}
      </div>
    </DropdownMenu>
  );
}

export function WorkspaceSwitcher({
  initialOpen = false,
  pathnameOverride,
  stateOverride,
}: Readonly<WorkspaceSwitcherProps>) {
  const pathnameFromRouter = usePathname();
  const pathname = pathnameOverride ?? pathnameFromRouter;
  const router = useRouter();
  const currentWorkspaceId = getCurrentWorkspaceIdFromPathname(pathname);
  const query = useQuery({
    queryKey: workspaceListQueryKey,
    queryFn: ({ signal }) => listWorkspaces({ signal }),
    retry: false,
    staleTime: 60_000,
  });

  const dataState =
    stateOverride ??
    getWorkspaceSwitcherDataState({
      error: coerceWorkspaceQueryError(query.error),
      workspaces: query.data,
      pending: query.isPending,
    });

  return (
    <WorkspaceSwitcherMenu
      currentWorkspaceId={currentWorkspaceId}
      dataState={dataState}
      initialOpen={initialOpen}
      onRetry={() => {
        query.refetch().catch(() => undefined);
      }}
      onSelectWorkspace={(workspaceId) => {
        router.push(`/w/${workspaceId}`);
      }}
      onCreateWorkspace={() => {
        router.push("/workspaces/new");
      }}
    />
  );
}
