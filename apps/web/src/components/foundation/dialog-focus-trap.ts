export const dialogFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export const getFocusableElements = (container: HTMLElement | null): HTMLElement[] =>
  Array.from(container?.querySelectorAll<HTMLElement>(dialogFocusableSelector) ?? []);

export const getFocusTrapTarget = ({
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

