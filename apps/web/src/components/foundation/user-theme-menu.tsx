"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { logoutCurrentSession } from "../../lib/api/auth";
import type { ThemePreference } from "../../lib/theme";
import { useTheme } from "../theme/theme-provider";

type ThemeUserMenuProps = {
  initialOpen?: boolean;
};

type ThemeMenuOption = {
  value: ThemePreference;
  label: string;
  description: string;
};

type ThemeMenuOptionKey =
  | "ArrowDown"
  | "ArrowUp"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown";

type ThemeMenuOpenKey = "Enter" | " " | "ArrowDown" | "ArrowUp";

type UserMenuLinkAction = {
  kind: "link";
  key: "action:dashboard" | "action:settings";
  label: string;
  description: string;
  href: string;
  mark: string;
};

type UserMenuThemeAction = {
  kind: "theme";
  key: `theme:${ThemePreference}`;
  label: string;
  description: string;
  preference: ThemePreference;
};

type UserMenuSignOutAction = {
  kind: "signout";
  key: "action:signout";
  label: string;
  description: string;
  mark: string;
};

type UserMenuAction = UserMenuLinkAction | UserMenuThemeAction | UserMenuSignOutAction;

const placeholderIdentity = {
  badge: "Shell",
  description:
    "Profile, email, and role details will appear here once the current-user API contract is wired into the web shell.",
  initials: "CS",
  name: "CollabSphere member",
  triggerMeta: "Account shell with local theme controls",
} as const;

export const themeMenuOptions: readonly ThemeMenuOption[] = [
  {
    value: "light",
    label: "Light",
    description: "Bright canvas for focused daytime work.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Lower-glare surfaces for extended sessions.",
  },
  {
    value: "system",
    label: "System",
    description: "Follow the operating system appearance preference.",
  },
] as const;

const themeMenuNavigationKeys = new Set<ThemeMenuOptionKey>([
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

const navigationActions: readonly UserMenuLinkAction[] = [
  {
    kind: "link",
    key: "action:dashboard",
    label: "Dashboard",
    description: "Return to the global workspace command center.",
    href: "/dashboard",
    mark: "DB",
  },
  {
    kind: "link",
    key: "action:settings",
    label: "Settings",
    description: "Open account profile and preference routes.",
    href: "/settings/profile",
    mark: "ST",
  },
] as const;

const signOutAction: UserMenuSignOutAction = {
  kind: "signout",
  key: "action:signout",
  label: "Sign out",
  description: "Close the current session and return to the login route.",
  mark: "SO",
};

export const isThemeMenuOpenKey = (key: string): key is ThemeMenuOpenKey =>
  key === "Enter" || key === " " || key === "ArrowDown" || key === "ArrowUp";

export const isThemeMenuNavigationKey = (
  key: string,
): key is ThemeMenuOptionKey => themeMenuNavigationKeys.has(key as ThemeMenuOptionKey);

export const getThemeMenuNextIndex = (
  currentIndex: number,
  key: ThemeMenuOptionKey,
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

export const getThemeMenuOpenIndex = (
  key: ThemeMenuOpenKey,
  defaultIndex: number,
  itemCount: number,
) => {
  if (itemCount <= 0) {
    return -1;
  }

  if (key === "ArrowUp") {
    return itemCount - 1;
  }

  return defaultIndex >= 0 ? defaultIndex : 0;
};

export const getThemeMenuStatusLabel = (
  preference: ThemePreference,
  resolvedTheme: "light" | "dark",
) => {
  if (preference === "system") {
    return `System · following ${resolvedTheme}`;
  }

  return `${preference === "light" ? "Light" : "Dark"} locked`;
};

const getThemeActions = (): UserMenuThemeAction[] =>
  themeMenuOptions.map((option) => ({
    kind: "theme",
    key: `theme:${option.value}`,
    label: option.label,
    description: option.description,
    preference: option.value,
  }));

const getUserMenuActions = (): UserMenuAction[] => [
  ...navigationActions,
  ...getThemeActions(),
  signOutAction,
];

const navigateToMenuHref = (href: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(href);
};

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign("/login");
};

export function ThemeUserMenu({ initialOpen = false }: ThemeUserMenuProps) {
  const queryClient = useQueryClient();
  const { preference, resolvedTheme, setThemePreference } = useTheme();
  const menuId = useId();
  const triggerId = `${menuId}-trigger`;
  const navigationLabelId = `${menuId}-navigation`;
  const themeLabelId = `${menuId}-theme`;
  const signOutLabelId = `${menuId}-signout`;
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const actions = getUserMenuActions();
  const [activeIndex, setActiveIndex] = useState(0);
  const statusLabel = hasMounted
    ? getThemeMenuStatusLabel(preference, resolvedTheme)
    : "Account menu";

  const signOutMutation = useMutation({
    mutationFn: () => logoutCurrentSession(),
    onSuccess: () => {
      queryClient.clear();
      redirectToLogin();
    },
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  const openMenu = (nextIndex = 0) => {
    setActiveIndex(nextIndex);
    setIsOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isThemeMenuOpenKey(event.key)) {
      return;
    }

    event.preventDefault();
    openMenu(getThemeMenuOpenIndex(event.key, 0, actions.length));
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (!isThemeMenuNavigationKey(event.key)) {
      return;
    }

    event.preventDefault();
    setActiveIndex(getThemeMenuNextIndex(activeIndex, event.key, actions.length));
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

  const handleActionSelect = (action: UserMenuAction) => {
    if (action.kind === "link") {
      closeMenu();
      navigateToMenuHref(action.href);
      return;
    }

    if (action.kind === "theme") {
      setThemePreference(action.preference);
      closeMenu(true);
      return;
    }

    signOutMutation.reset();
    signOutMutation.mutate();
  };

  const signOutStatus =
    signOutMutation.isPending
      ? {
          kind: "pending" as const,
          message: "Signing out of the current session.",
        }
      : signOutMutation.isError
        ? {
            kind: "error" as const,
            message: signOutMutation.error.message,
          }
        : null;

  return (
    <div ref={rootRef} className="shell-user-menu">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="shell-user-menu__trigger"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }

          openMenu(0);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="shell-user-menu__avatar" aria-hidden="true">
          {placeholderIdentity.initials}
        </span>
        <span className="shell-user-menu__trigger-copy">
          <span className="shell-user-menu__trigger-label">
            {placeholderIdentity.name}
          </span>
          <span
            className="shell-user-menu__trigger-state"
            suppressHydrationWarning
          >
            {statusLabel}
          </span>
        </span>
        <span className="shell-user-menu__trigger-caret" aria-hidden="true">
          {isOpen ? "▴" : "▾"}
        </span>
      </button>
      {isOpen ? (
        <div id={menuId} className="shell-user-menu__panel">
          <div className="shell-user-menu__identity" role="presentation">
            <span className="shell-user-menu__identity-avatar" aria-hidden="true">
              {placeholderIdentity.initials}
            </span>
            <div className="shell-user-menu__identity-copy">
              <span className="shell-user-menu__identity-name">
                {placeholderIdentity.name}
              </span>
              <span className="shell-user-menu__identity-meta">
                {placeholderIdentity.description}
              </span>
            </div>
            <span className="shell-user-menu__identity-badge">
              {placeholderIdentity.badge}
            </span>
          </div>
          <div className="shell-user-menu__divider" role="presentation" />
          <div
            className="shell-user-menu__menu"
            role="menu"
            aria-labelledby={triggerId}
            onKeyDown={handleMenuKeyDown}
          >
            <p id={navigationLabelId} className="shell-user-menu__section-label">
              Account shortcuts
            </p>
            <div className="shell-user-menu__options" role="group" aria-labelledby={navigationLabelId}>
              {navigationActions.map((action, index) => (
                <button
                  key={action.key}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={index === activeIndex ? 0 : -1}
                  className="shell-user-menu__option shell-user-menu__option--link"
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
                  <span className="shell-user-menu__action-mark" aria-hidden="true">
                    {action.mark}
                  </span>
                  <span className="shell-user-menu__option-copy">
                    <span className="shell-user-menu__option-label">{action.label}</span>
                    <span className="shell-user-menu__option-description">
                      {action.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="shell-user-menu__divider" role="presentation" />
            <p id={themeLabelId} className="shell-user-menu__section-label">
              Display theme
            </p>
            <div className="shell-user-menu__options" role="group" aria-labelledby={themeLabelId}>
              {themeMenuOptions.map((option, optionIndex) => {
                const index = navigationActions.length + optionIndex;
                const checked = option.value === preference;
                const action = actions[index];

                if (!action || action.kind !== "theme") {
                  return null;
                }

                return (
                  <button
                    key={option.value}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={checked}
                    tabIndex={index === activeIndex ? 0 : -1}
                    className="shell-user-menu__option shell-user-menu__option--theme"
                    data-selected={checked}
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
                    <span
                      className="shell-user-menu__option-indicator"
                      aria-hidden="true"
                    />
                    <span className="shell-user-menu__option-copy">
                      <span className="shell-user-menu__option-label">
                        {option.label}
                      </span>
                      <span className="shell-user-menu__option-description">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="shell-user-menu__divider" role="presentation" />
            <p id={signOutLabelId} className="shell-user-menu__section-label">
              Session
            </p>
            <div className="shell-user-menu__options" role="group" aria-labelledby={signOutLabelId}>
              <button
                ref={(node) => {
                  itemRefs.current[actions.length - 1] = node;
                }}
                type="button"
                role="menuitem"
                tabIndex={actions.length - 1 === activeIndex ? 0 : -1}
                className="shell-user-menu__option shell-user-menu__option--signout"
                onClick={() => {
                  handleActionSelect(signOutAction);
                }}
                onFocus={() => {
                  setActiveIndex(actions.length - 1);
                }}
                onPointerMove={(event) => {
                  handleActionPointerMove(event, actions.length - 1);
                }}
                aria-disabled={signOutMutation.isPending}
                disabled={signOutMutation.isPending}
              >
                <span className="shell-user-menu__action-mark" aria-hidden="true">
                  {signOutAction.mark}
                </span>
                <span className="shell-user-menu__option-copy">
                  <span className="shell-user-menu__option-label">
                    {signOutAction.label}
                  </span>
                  <span className="shell-user-menu__option-description">
                    {signOutAction.description}
                  </span>
                </span>
              </button>
              {signOutStatus ? (
                <p
                  className="shell-user-menu__status"
                  role={signOutStatus.kind === "error" ? "alert" : "status"}
                >
                  {signOutStatus.message}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
