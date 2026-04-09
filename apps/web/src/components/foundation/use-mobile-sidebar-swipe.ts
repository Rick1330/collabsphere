"use client";

import * as React from "react";

import { getMobileSidebarSwipeAction, isMobileSidebarOpenGestureStart } from "./mobile-sidebar-swipe";

type TouchSession = {
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
};

const readTouchCoordinates = (touchList: TouchList, fallback: TouchSession) => {
  const touch = touchList[0];

  return {
    x: touch?.clientX ?? fallback.lastX,
    y: touch?.clientY ?? fallback.lastY,
  };
};

export function useMobileSidebarSwipe({
  enabled,
  isOpen,
  onClose,
  onOpen,
  panelRef,
}: {
  enabled: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  const documentTouchSessionRef = React.useRef<TouchSession | null>(null);
  const panelTouchSessionRef = React.useRef<TouchSession | null>(null);

  React.useEffect(() => {
    if (!enabled || isOpen || typeof window === "undefined") {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        documentTouchSessionRef.current = null;
        return;
      }

      const touch = event.touches[0];

      if (!isMobileSidebarOpenGestureStart(touch.clientX)) {
        documentTouchSessionRef.current = null;
        return;
      }

      documentTouchSessionRef.current = {
        lastX: touch.clientX,
        lastY: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      const session = documentTouchSessionRef.current;

      if (session == null || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      session.lastX = touch.clientX;
      session.lastY = touch.clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const session = documentTouchSessionRef.current;
      documentTouchSessionRef.current = null;

      if (session == null) {
        return;
      }

      const coordinates = readTouchCoordinates(event.changedTouches, session);
      const action = getMobileSidebarSwipeAction({
        endX: coordinates.x,
        endY: coordinates.y,
        isOpen: false,
        panelWidth: window.innerWidth,
        startX: session.startX,
        startY: session.startY,
        viewportWidth: window.innerWidth,
      });

      if (action === "open") {
        onOpen();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      documentTouchSessionRef.current = null;
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [enabled, isOpen, onOpen]);

  React.useEffect(() => {
    if (!enabled || !isOpen || typeof window === "undefined") {
      return;
    }

    const panel = panelRef.current;

    if (panel == null) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        panelTouchSessionRef.current = null;
        return;
      }

      const touch = event.touches[0];
      panelTouchSessionRef.current = {
        lastX: touch.clientX,
        lastY: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      const session = panelTouchSessionRef.current;

      if (session == null || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      session.lastX = touch.clientX;
      session.lastY = touch.clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const session = panelTouchSessionRef.current;
      panelTouchSessionRef.current = null;

      if (session == null) {
        return;
      }

      const coordinates = readTouchCoordinates(event.changedTouches, session);
      const action = getMobileSidebarSwipeAction({
        endX: coordinates.x,
        endY: coordinates.y,
        isOpen: true,
        panelWidth: panel.getBoundingClientRect().width,
        startX: session.startX,
        startY: session.startY,
        viewportWidth: window.innerWidth,
      });

      if (action === "close") {
        onClose();
      }
    };

    panel.addEventListener("touchstart", handleTouchStart, { passive: true });
    panel.addEventListener("touchmove", handleTouchMove, { passive: true });
    panel.addEventListener("touchend", handleTouchEnd, { passive: true });
    panel.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      panelTouchSessionRef.current = null;
      panel.removeEventListener("touchstart", handleTouchStart);
      panel.removeEventListener("touchmove", handleTouchMove);
      panel.removeEventListener("touchend", handleTouchEnd);
      panel.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [enabled, isOpen, onClose, panelRef]);
}

