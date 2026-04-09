"use client";

import Link from "next/link";
import * as React from "react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { NavItem } from "./navigation";
import {
  mobileSidebarMediaQuery,
} from "./mobile-sidebar-swipe";
import { useMobileSidebarSwipe } from "./use-mobile-sidebar-swipe";

type MobileMenuProps = {
  description: string;
  initialOpen?: boolean;
  navItems: NavItem[];
  title: string;
};

type MobileMenuOpenKey = "Enter" | " " | "ArrowDown";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const getFocusableElements = (container: HTMLElement | null): HTMLElement[] =>
  Array.from(container?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);

const getFocusTrapTarget = ({
  activeElement,
  firstElement,
  lastElement,
  shiftKey,
}: {
  activeElement: Element | null;
  firstElement: HTMLElement | undefined;
  lastElement: HTMLElement | undefined;
  shiftKey: boolean;
}): HTMLElement | null => {
  if (firstElement == null || lastElement == null) {
    return null;
  }

  if (shiftKey && activeElement === firstElement) {
    return lastElement;
  }

  if (!shiftKey && activeElement === lastElement) {
    return firstElement;
  }

  return null;
};

export const isMobileMenuOpenKey = (key: string): key is MobileMenuOpenKey =>
  key === "Enter" || key === " " || key === "ArrowDown";

export function MobileMenu({
  description,
  initialOpen = false,
  navItems,
  title,
}: Readonly<MobileMenuProps>) {
  const menuId = useId();
  const triggerId = `${menuId}-trigger`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const openMenu = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(mobileSidebarMediaQuery);
    setIsMobileViewport(mediaQuery.matches);

    if (isOpen && !mediaQuery.matches) {
      closeMenu();
    }

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);

      if (!event.matches) {
        closeMenu();
      }
    };

    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, [closeMenu, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  useMobileSidebarSwipe({
    enabled: isMobileViewport,
    isOpen,
    onClose: closeMenu,
    onOpen: openMenu,
    panelRef,
  });

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isMobileMenuOpenKey(event.key)) {
      return;
    }

    event.preventDefault();
    openMenu();
  };

  const handleDialogCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    closeMenu();
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      closeButtonRef.current?.focus();
      return;
    }

    const target = getFocusTrapTarget({
      activeElement: document.activeElement,
      firstElement: focusableElements[0],
      lastElement: focusableElements[focusableElements.length - 1],
      shiftKey: event.shiftKey,
    });

    if (target != null) {
      event.preventDefault();
      target.focus();
    }
  };

  return (
    <div className="mobile-menu">
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        className="top-nav__hamburger"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Open navigation menu"
        onClick={openMenu}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="top-nav__hamburger-mark" aria-hidden="true">
          ☰
        </span>
      </button>

      {isOpen ? (
        <dialog
          ref={dialogRef}
          id={menuId}
          className="mobile-menu__dialog"
          role="dialog"
          aria-labelledby={`${menuId}-title`}
          aria-describedby={`${menuId}-description`}
          aria-modal="true"
          open
          onCancel={handleDialogCancel}
          onKeyDown={handleDialogKeyDown}
        >
          <button
            type="button"
            className="mobile-menu__overlay"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />
          <div ref={panelRef} className="mobile-menu__panel">
            <div className="mobile-menu__header">
              <div className="mobile-menu__header-copy">
                <p className="mobile-menu__eyebrow">Mobile navigation</p>
                <p id={`${menuId}-title`} className="mobile-menu__title">
                  {title}
                </p>
                <p id={`${menuId}-description`} className="mobile-menu__description">
                  {description}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="mobile-menu__close"
                aria-label="Close navigation menu"
                onClick={closeMenu}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <nav className="mobile-menu__nav" aria-label="Mobile route navigation">
              <ul className="mobile-menu__list">
                {navItems.map((item) => (
                  <li key={item.href} className="mobile-menu__item">
                    <Link
                      className="mobile-menu__link"
                      href={item.href}
                      onClick={closeMenu}
                    >
                      <span className="mobile-menu__link-label">{item.label}</span>
                      <span className="mobile-menu__link-description">{item.hint}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
