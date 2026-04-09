"use client";

import * as React from "react";

import {
  getMobileSidebarSwipeAction,
  isMobileSidebarOpenGestureStart,
} from "./mobile-sidebar-swipe";

type TouchSession = {
  startX: number;
  startY: number;
};

const readTouchCoordinates = (touchList: TouchList) => {
  const touch = touchList[0];

  return {
    x: touch?.clientX ?? null,
    y: touch?.clientY ?? null,
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
    if (!enabled) {
      return;
    }

    if (isOpen) {
      return;
    }

    if (typeof window === "undefined") {
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
        startX: touch.clientX,
        startY: touch.clientY,
      };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const session = documentTouchSessionRef.current;
      documentTouchSessionRef.current = null;

      if (session == null) {
        return;
      }

      const coordinates = readTouchCoordinates(event.changedTouches);
      if (coordinates.x == null) {
        return;
      }

      if (coordinates.y == null) {
        return;
      }

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

    const handleTouchCancel = () => {
      documentTouchSessionRef.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      documentTouchSessionRef.current = null;
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [enabled, isOpen, onOpen]);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!isOpen) {
      return;
    }

    if (typeof window === "undefined") {
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
        startX: touch.clientX,
        startY: touch.clientY,
      };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const session = panelTouchSessionRef.current;
      panelTouchSessionRef.current = null;

      if (session == null) {
        return;
      }

      const coordinates = readTouchCoordinates(event.changedTouches);
      if (coordinates.x == null) {
        return;
      }

      if (coordinates.y == null) {
        return;
      }

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

    const handleTouchCancel = () => {
      panelTouchSessionRef.current = null;
    };

    panel.addEventListener("touchstart", handleTouchStart, { passive: true });
    panel.addEventListener("touchend", handleTouchEnd, { passive: true });
    panel.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      panelTouchSessionRef.current = null;
      panel.removeEventListener("touchstart", handleTouchStart);
      panel.removeEventListener("touchend", handleTouchEnd);
      panel.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [enabled, isOpen, onClose, panelRef]);
}
