"use client";

import Link from "next/link";
import * as React from "react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from "@collabsphere/ui/components/dialog";

import type { NavItem } from "./navigation";
import { mobileSidebarMediaQuery } from "./mobile-sidebar-swipe";
import { useMobileSidebarSwipe } from "./use-mobile-sidebar-swipe";

type MobileMenuProps = {
  description: string;
  initialOpen?: boolean;
  navItems: NavItem[];
  title: string;
};

type MobileMenuOpenKey = "Enter" | " " | "ArrowDown";

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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const openMenu = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
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

  useMobileSidebarSwipe({
    enabled: isMobileViewport,
    isOpen,
    onClose: () => {
      closeMenu();
    },
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

      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeMenu();
            return;
          }

          openMenu();
        }}
      >
        {isOpen ? (
          <div id={menuId} className="mobile-menu__dialog">
            <DialogOverlay className="mobile-menu__overlay" />
            <DialogContent
              ref={panelRef}
              className="mobile-menu__panel"
              aria-describedby={`${menuId}-description`}
              aria-labelledby={`${menuId}-title`}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                triggerRef.current?.focus();
              }}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                closeButtonRef.current?.focus();
              }}
            >
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
                  onClick={() => {
                    closeMenu(true);
                  }}
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
                        onClick={() => {
                          closeMenu();
                        }}
                      >
                        <span className="mobile-menu__link-label">{item.label}</span>
                        <span className="mobile-menu__link-description">{item.hint}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </DialogContent>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
