"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  default as React,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

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
      key: "retry";
      label: string;
      description: string;
    }
  | {
      kind: "create";
      key: "create";
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

export const isWorkspaceMenuNavigationKey = (
  key: string,
): key is WorkspaceMenuNavigationKey =>
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

export const getCurrentWorkspaceIdFromPathname = (
  pathname: string | null | undefined,
) => {
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

const getWorkspaceContextLabel = (
  currentWorkspaceId: string | null,
  fallbackLabel: string,
) => (currentWorkspaceId ? "Current workspace" : fallbackLabel);

const createWorkspaceAction = (
  description: string,
): WorkspaceSwitcherAction => ({
  kind: "create",
  key: "create",
  label: "Create workspace",
  description,
});

const retryWorkspaceAction = (): WorkspaceSwitcherAction => ({
  kind: "retry",
  key: "retry",
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
  if (pending) {
    return { kind: "loading" };
  }

  if (error) {
    return {
      kind: "error",
      message: error.message,
      requestId: error.requestId,
    };
  }

  if (!workspaces || workspaces.length === 0) {
    return { kind: "empty" };
  }

  return {
    kind: "loaded",
    workspaces,
  };
};

const coerceWorkspaceQueryError = (error: unknown) => {
  if (error instanceof WorkspaceApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new WorkspaceApiError("unknown", error.message);
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
        key: workspace.id,
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
  <div className="workspace-switcher__skeleton-list" aria-hidden="true">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={`workspace-skeleton-${index}`} className="workspace-switcher__skeleton-row">
        <span className="workspace-switcher__skeleton-mark" />
        <span className="workspace-switcher__skeleton-copy">
          <span className="workspace-switcher__skeleton-line workspace-switcher__skeleton-line--primary" />
          <span className="workspace-switcher__skeleton-line workspace-switcher__skeleton-line--secondary" />
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
}: WorkspaceSwitcherMenuProps) {
  const menuId = useId();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const actions = getWorkspaceSwitcherActions(dataState, currentWorkspaceId);
  const currentWorkspaceIndex = actions.findIndex(
    (action) => action.kind === "workspace" && action.current,
  );
  const [activeIndex, setActiveIndex] = useState(() =>
    getDefaultActiveIndex(currentWorkspaceIndex),
  );
  const triggerCopy = getWorkspaceTriggerCopy(dataState, currentWorkspaceId);

  useEffect(() => {
    setActiveIndex((currentIndex) => {
      const nextIndex = getClampedWorkspaceMenuIndex(currentIndex, actions.length);
      return nextIndex === currentIndex ? currentIndex : nextIndex;
    });
  }, [actions.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const openMenu = (nextIndex = getDefaultActiveIndex(currentWorkspaceIndex)) => {
    setActiveIndex(getClampedWorkspaceMenuIndex(nextIndex, actions.length));
    setIsOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!isWorkspaceMenuOpenKey(event.key)) {
      return;
    }

    event.preventDefault();
    openMenu(
      getWorkspaceMenuOpenIndex(event.key, currentWorkspaceIndex, actions.length),
    );
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (!isWorkspaceMenuNavigationKey(event.key)) {
      return;
    }

    event.preventDefault();
    setActiveIndex(
      getWorkspaceMenuNextIndex(activeIndex, event.key, actions.length),
    );
  };

  const handleActionSelect = (action: WorkspaceSwitcherAction) => {
    if (action.kind === "workspace") {
      onSelectWorkspace?.(action.workspace.id);
      closeMenu(true);
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

  const handleActionPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }

    setActiveIndex(index);
  };

  return (
    <div ref={rootRef} className="workspace-switcher">
      <button
        ref={triggerRef}
        id={`${menuId}-trigger`}
        type="button"
        className="workspace-switcher__trigger"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }

          openMenu(getDefaultActiveIndex(currentWorkspaceIndex));
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="workspace-switcher__trigger-mark" aria-hidden="true">
          {triggerCopy.icon}
        </span>
        <span className="workspace-switcher__trigger-copy">
          <span className="workspace-switcher__trigger-label">{triggerCopy.label}</span>
          <span className="workspace-switcher__trigger-meta">{triggerCopy.meta}</span>
        </span>
        <span className="workspace-switcher__trigger-caret" aria-hidden="true">
          {isOpen ? "▴" : "▾"}
        </span>
      </button>

      {isOpen ? (
        <div id={menuId} className="workspace-switcher__panel">
          <div className="workspace-switcher__panel-header">
            <p className="workspace-switcher__panel-eyebrow">Workspace switcher</p>
            <p className="workspace-switcher__panel-title">
              {currentWorkspaceId ? "Switch workspace context" : "Select Workspace"}
            </p>
          </div>

          {dataState.kind === "loading" ? (
            <div
              className="workspace-switcher__state workspace-switcher__state--loading"
              role="status"
              aria-live="polite"
            >
              <LoadingWorkspaceSkeleton />
              <p className="workspace-switcher__state-copy">
                Loading member workspaces.
              </p>
            </div>
          ) : null}

          {dataState.kind === "empty" ? (
            <div
              className="workspace-switcher__state workspace-switcher__state--empty"
              role="status"
              aria-live="polite"
            >
              <strong className="workspace-switcher__state-title">
                No workspaces yet
              </strong>
              <p className="workspace-switcher__state-copy">
                Create your first workspace or join one through an invitation.
              </p>
            </div>
          ) : null}

          {dataState.kind === "error" ? (
            <div
              className="workspace-switcher__state workspace-switcher__state--error"
              role="status"
              aria-live="polite"
            >
              <strong className="workspace-switcher__state-title">
                Workspace list unavailable
              </strong>
              <p className="workspace-switcher__state-copy">{dataState.message}</p>
              {dataState.requestId ? (
                <p className="workspace-switcher__state-meta">
                  Request ID: {dataState.requestId}
                </p>
              ) : null}
            </div>
          ) : null}

          <div
            className="workspace-switcher__menu"
            role="menu"
            aria-labelledby={`${menuId}-trigger`}
            onKeyDown={handleMenuKeyDown}
          >
            {actions.map((action, index) => {
              const isCurrent = action.kind === "workspace" && action.current;

              return (
                <button
                  key={action.key}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={index === activeIndex ? 0 : -1}
                  className="workspace-switcher__item"
                  data-current={isCurrent}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-label={
                    action.kind === "workspace" && action.current
                      ? `${action.workspace.name}, current workspace`
                      : undefined
                  }
                  onClick={() => {
                    handleActionSelect(action);
                  }}
                  onFocus={() => {
                    setActiveIndex(index);
                  }}
                  onPointerMove={(event) => {
                    handleActionPointerMove(event, index);
                  }}
                >
                  {action.kind === "workspace" ? (
                    <>
                      <span className="workspace-switcher__item-mark" aria-hidden="true">
                        {getWorkspaceInitials(action.workspace)}
                      </span>
                      <span className="workspace-switcher__item-copy">
                        <span className="workspace-switcher__item-label-row">
                          <span className="workspace-switcher__item-label">
                            {action.workspace.name}
                          </span>
                          {action.current ? (
                            <span className="workspace-switcher__item-badge">Current</span>
                          ) : null}
                        </span>
                        <span className="workspace-switcher__item-description">
                          {getWorkspaceMeta(action.workspace)}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="workspace-switcher__item-mark" aria-hidden="true">
                        {action.kind === "retry" ? "↺" : "+"}
                      </span>
                      <span className="workspace-switcher__item-copy">
                        <span className="workspace-switcher__item-label">
                          {action.label}
                        </span>
                        <span className="workspace-switcher__item-description">
                          {action.description}
                        </span>
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function WorkspaceSwitcher({
  initialOpen = false,
  pathnameOverride,
  stateOverride,
}: WorkspaceSwitcherProps) {
  const pathnameFromRouter = usePathname();
  const pathname = pathnameOverride ?? pathnameFromRouter;
  const router = useRouter();
  const currentWorkspaceId = getCurrentWorkspaceIdFromPathname(pathname);
  const query = useQuery({
    queryKey: workspaceListQueryKey,
    queryFn: ({ signal }) => listWorkspaces({ signal }),
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
        void query.refetch();
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
