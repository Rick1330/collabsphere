"use client";

import * as React from "react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

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

const placeholderIdentity = {
  initials: "CS",
  name: "CollabSphere member",
  meta: "Theme preference stored locally on this device",
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

export const isThemeMenuOpenKey = (key: string) =>
  key === "Enter" || key === " " || key === "ArrowDown" || key === "ArrowUp";

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

export const getThemeMenuStatusLabel = (
  preference: ThemePreference,
  resolvedTheme: "light" | "dark",
) => {
  if (preference === "system") {
    return `System · following ${resolvedTheme}`;
  }

  return `${preference === "light" ? "Light" : "Dark"} locked`;
};

export function ThemeUserMenu({ initialOpen = false }: ThemeUserMenuProps) {
  const { preference, resolvedTheme, setThemePreference } = useTheme();
  const menuId = useId();
  const triggerId = `${menuId}-trigger`;
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeIndex, setActiveIndex] = useState(() =>
    themeMenuOptions.findIndex((option) => option.value === preference),
  );

  const selectedIndex = useMemo(
    () => themeMenuOptions.findIndex((option) => option.value === preference),
    [preference],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveIndex(selectedIndex);
  }, [isOpen, selectedIndex]);

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

  const openMenu = (nextIndex = selectedIndex) => {
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

    if (event.key === "ArrowUp") {
      openMenu(themeMenuOptions.length - 1);
      return;
    }

    openMenu(selectedIndex);
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

    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End" &&
      event.key !== "PageUp" &&
      event.key !== "PageDown"
    ) {
      return;
    }

    event.preventDefault();
    setActiveIndex(
      getThemeMenuNextIndex(
        activeIndex,
        event.key,
        themeMenuOptions.length,
      ),
    );
  };

  const handleOptionClick = (nextPreference: ThemePreference) => {
    setThemePreference(nextPreference);
    closeMenu(true);
  };

  const handleOptionPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }

    setActiveIndex(index);
  };

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

          openMenu(selectedIndex);
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
          <span className="shell-user-menu__trigger-state">
            {getThemeMenuStatusLabel(preference, resolvedTheme)}
          </span>
        </span>
        <span className="shell-user-menu__trigger-caret" aria-hidden="true">
          {isOpen ? "▴" : "▾"}
        </span>
      </button>
      {isOpen ? (
        <div
          id={menuId}
          className="shell-user-menu__panel"
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={handleMenuKeyDown}
        >
          <div className="shell-user-menu__identity" role="presentation">
            <span className="shell-user-menu__identity-avatar" aria-hidden="true">
              {placeholderIdentity.initials}
            </span>
            <div className="shell-user-menu__identity-copy">
              <span className="shell-user-menu__identity-name">
                {placeholderIdentity.name}
              </span>
              <span className="shell-user-menu__identity-meta">
                {placeholderIdentity.meta}
              </span>
            </div>
          </div>
          <div className="shell-user-menu__divider" role="presentation" />
          <div
            className="shell-user-menu__theme-group"
            role="presentation"
            aria-label="Theme options"
          >
            <p className="shell-user-menu__section-label">Display theme</p>
            <div className="shell-user-menu__options" role="presentation">
              {themeMenuOptions.map((option, index) => {
                const checked = option.value === preference;

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
                    className="shell-user-menu__option"
                    data-selected={checked}
                    onClick={() => {
                      handleOptionClick(option.value);
                    }}
                    onFocus={() => {
                      setActiveIndex(index);
                    }}
                    onPointerMove={(event) => {
                      handleOptionPointerMove(event, index);
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
