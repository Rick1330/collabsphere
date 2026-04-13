"use client";

export const mobileSidebarMediaQuery = "(max-width: 767px)";

const mobileSidebarEdgeActivationWidth = 32;
const mobileSidebarMinSwipeDistance = 72;
const mobileSidebarMaxCrossAxisDistance = 48;

export type MobileSidebarSwipeAction = "open" | "close" | null;

export const isMobileSidebarOpenGestureStart = (startX: number) =>
  startX <= mobileSidebarEdgeActivationWidth;

export const getMobileSidebarSwipeAction = ({
  endX,
  endY,
  isOpen,
  panelWidth,
  startX,
  startY,
  viewportWidth,
}: {
  endX: number;
  endY: number;
  isOpen: boolean;
  panelWidth: number;
  startX: number;
  startY: number;
  viewportWidth: number;
}): MobileSidebarSwipeAction => {
  const horizontalDistance = endX - startX;
  const crossAxisDistance = Math.abs(endY - startY);

  if (
    Math.abs(horizontalDistance) < mobileSidebarMinSwipeDistance ||
    crossAxisDistance > mobileSidebarMaxCrossAxisDistance
  ) {
    return null;
  }

  if (!isOpen) {
    const edgeActivationWidth = Math.min(mobileSidebarEdgeActivationWidth, viewportWidth);

    return startX <= edgeActivationWidth && horizontalDistance > 0 ? "open" : null;
  }

  const closeBoundary = Math.max(1, Math.min(panelWidth, viewportWidth));

  return startX <= closeBoundary && horizontalDistance < 0 ? "close" : null;
};
