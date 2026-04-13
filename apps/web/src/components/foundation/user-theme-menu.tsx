"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@collabsphere/ui/components/dropdown-menu";

import { AuthApiError, logoutCurrentSession } from "../../lib/api/auth";
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
type ThemeMenuLinkActivationKey = " ";

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

type ThemeUserMenuSignOutState =
  | { kind: "pending"; message: string; requestId: null }
  | { kind: "error"; message: string; requestId: string | null }
  | null;

type UserMenuItemElement = HTMLElement;

const placeholderIdentity = {
  badge: "Shell",
  description:
    "Profile, email, and role details will appear here once the current-user API contract is wired into the web shell.",
  initials: "CS",
  name: "CollabSphere member",
} as const;

const navigationSectionLabel = "Account shortcuts";
const themeSectionLabel = "Display theme";
const signOutSectionLabel = "Session";

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

export const isThemeMenuNavigationKey = (key: string): key is ThemeMenuOptionKey =>
  themeMenuNavigationKeys.has(key as ThemeMenuOptionKey);

export const isThemeMenuLinkActivationKey = (
  key: string,
): key is ThemeMenuLinkActivationKey => key === " ";

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

export const getThemeUserMenuSignOutState = ({
  error,
  isError,
  isPending,
}: {
  error: unknown;
  isError: boolean;
  isPending: boolean;
}): ThemeUserMenuSignOutState => {
  if (isPending) {
    return {
      kind: "pending",
      message: "Signing out of the current session.",
      requestId: null,
    };
  }

  if (!isError) {
    return null;
  }

  if (error instanceof AuthApiError) {
    return {
      kind: "error",
      message: error.message,
      requestId: error.requestId,
    };
  }

  return {
    kind: "error",
    message: "Unable to sign out. Please try again.",
    requestId: null,
  };
};

const getThemeActions = (): UserMenuThemeAction[] =>
  themeMenuOptions.map((option) => ({
    kind: "theme",
    key: `theme:${option.value}`,
    label: option.label,
    description: option.description,
    preference: option.value,
  }));

const getUserMenuActions = (): UserMenuAction[] => [...navigationActions, ...getThemeActions(), signOutAction];

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign("/login");
};

export function ThemeUserMenu({ initialOpen = false }: Readonly<ThemeUserMenuProps>) {
  const queryClient = useQueryClient();
  const { preference, resolvedTheme, setThemePreference } = useTheme();
  const menuId = useId();
  const triggerId = `${menuId}-trigger`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<UserMenuItemElement | null>>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [openIndex, setOpenIndex] = useState(0);
  const actions = getUserMenuActions();
  const statusLabel = hasMounted
    ? getThemeMenuStatusLabel(preference, resolvedTheme)
    : "Account menu";

  const signOutMutation = useMutation({
    mutationFn: () => logoutCurrentSession(),
    onSuccess: () => {
      setIsOpen(false);
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

    itemRefs.current[openIndex]?.focus();
  }, [isOpen, openIndex]);

  const openMenu = (nextIndex = 0) => {
    setOpenIndex(nextIndex);
    setIsOpen(true);
  };

  const signOutStatus = getThemeUserMenuSignOutState({
    error: signOutMutation.error,
    isError: signOutMutation.isError,
    isPending: signOutMutation.isPending,
  });

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
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
              setIsOpen(false);
              return;
            }

            openMenu(0);
          }}
          onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
            if (!isThemeMenuOpenKey(event.key)) {
              return;
            }

            event.preventDefault();
            openMenu(getThemeMenuOpenIndex(event.key, 0, actions.length));
          }}
        >
          <span className="shell-user-menu__avatar" aria-hidden="true">
            {placeholderIdentity.initials}
          </span>
          <span className="shell-user-menu__trigger-copy">
            <span className="shell-user-menu__trigger-label">{placeholderIdentity.name}</span>
            <span className="shell-user-menu__trigger-state" suppressHydrationWarning>
              {statusLabel}
            </span>
          </span>
          <span className="shell-user-menu__trigger-caret" aria-hidden="true">
            {isOpen ? "▴" : "▾"}
          </span>
        </button>
      </DropdownMenuTrigger>

      {isOpen ? (
        <DropdownMenuContent
          id={menuId}
          className="shell-user-menu__panel"
          align="end"
          sideOffset={12}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <div className="shell-user-menu__identity" role="presentation">
            <span className="shell-user-menu__identity-avatar" aria-hidden="true">
              {placeholderIdentity.initials}
            </span>
            <div className="shell-user-menu__identity-copy">
              <span className="shell-user-menu__identity-name">{placeholderIdentity.name}</span>
              <span className="shell-user-menu__identity-meta">{placeholderIdentity.description}</span>
            </div>
            <span className="shell-user-menu__identity-badge">{placeholderIdentity.badge}</span>
          </div>

          <DropdownMenuSeparator className="shell-user-menu__divider" />

          <div className="shell-user-menu__menu">
            <p className="shell-user-menu__section-label" role="presentation" aria-hidden="true">
              {navigationSectionLabel}
            </p>
            <DropdownMenuGroup className="shell-user-menu__options" aria-label={navigationSectionLabel}>
              {navigationActions.map((action, index) => (
                <DropdownMenuItem key={action.key} asChild className="shell-user-menu__option shell-user-menu__option--link">
                  <Link
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    href={action.href}
                    onKeyDown={(event) => {
                      if (!isThemeMenuLinkActivationKey(event.key)) {
                        return;
                      }

                      event.preventDefault();
                      event.currentTarget.click();
                    }}
                  >
                    <span className="shell-user-menu__action-mark" aria-hidden="true">
                      {action.mark}
                    </span>
                    <span className="shell-user-menu__option-copy">
                      <span className="shell-user-menu__option-label">{action.label}</span>
                      <span className="shell-user-menu__option-description">{action.description}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="shell-user-menu__divider" />

            <p className="shell-user-menu__section-label" role="presentation" aria-hidden="true">
              {themeSectionLabel}
            </p>
            <DropdownMenuRadioGroup
              value={preference}
              onValueChange={(value) => {
                setThemePreference(value as ThemePreference);
                setIsOpen(false);
              }}
            >
              <DropdownMenuGroup className="shell-user-menu__options" aria-label={themeSectionLabel}>
                {themeMenuOptions.map((option, optionIndex) => {
                  const index = navigationActions.length + optionIndex;
                  const checked = option.value === preference;

                  return (
                    <DropdownMenuRadioItem
                      key={option.value}
                      ref={(node) => {
                        itemRefs.current[index] = node;
                      }}
                      value={option.value}
                      className="shell-user-menu__option shell-user-menu__option--theme"
                      data-selected={checked || undefined}
                    >
                      <span className="shell-user-menu__option-indicator" aria-hidden="true" />
                      <span className="shell-user-menu__option-copy">
                        <span className="shell-user-menu__option-label">{option.label}</span>
                        <span className="shell-user-menu__option-description">{option.description}</span>
                      </span>
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator className="shell-user-menu__divider" />

            <p className="shell-user-menu__section-label" role="presentation" aria-hidden="true">
              {signOutSectionLabel}
            </p>
            <DropdownMenuGroup className="shell-user-menu__options" aria-label={signOutSectionLabel}>
              <DropdownMenuItem
                ref={(node) => {
                  itemRefs.current[actions.length - 1] = node;
                }}
                className="shell-user-menu__option shell-user-menu__option--signout"
                aria-disabled={signOutMutation.isPending}
                data-pending={signOutMutation.isPending || undefined}
                onSelect={(event) => {
                  event.preventDefault();

                  if (signOutMutation.isPending) {
                    return;
                  }

                  signOutMutation.reset();
                  signOutMutation.mutate();
                }}
              >
                <span className="shell-user-menu__action-mark" aria-hidden="true">
                  {signOutAction.mark}
                </span>
                <span className="shell-user-menu__option-copy">
                  <span className="shell-user-menu__option-label">{signOutAction.label}</span>
                  <span className="shell-user-menu__option-description">{signOutAction.description}</span>
                </span>
              </DropdownMenuItem>

              {signOutStatus ? (
                <>
                  <p
                    className="shell-user-menu__status"
                    role={signOutStatus.kind === "error" ? "alert" : "status"}
                  >
                    {signOutStatus.message}
                  </p>
                  {signOutStatus.requestId ? (
                    <p className="shell-user-menu__status-meta">
                      Request ID: {signOutStatus.requestId}
                    </p>
                  ) : null}
                </>
              ) : null}
            </DropdownMenuGroup>
          </div>
        </DropdownMenuContent>
      ) : null}
    </DropdownMenu>
  );
}
