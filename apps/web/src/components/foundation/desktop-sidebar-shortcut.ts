const editableRoleSelector =
  '[role="textbox"], [role="searchbox"], [role="combobox"], [role="spinbutton"]';
const editableContentSelector =
  '[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';

type SidebarShortcutEvent = Pick<
  KeyboardEvent,
  | "altKey"
  | "ctrlKey"
  | "defaultPrevented"
  | "key"
  | "metaKey"
  | "preventDefault"
  | "shiftKey"
  | "target"
>;

export const isMacLikePlatform = ({
  platform,
  userAgent,
}: Readonly<{
  platform: string | undefined;
  userAgent: string | undefined;
}>) => /Mac|iPhone|iPad|iPod/i.test(`${platform ?? ""} ${userAgent ?? ""}`);

export const isDesktopSidebarShortcut = ({
  event,
  isMacLike,
}: Readonly<{
  event: SidebarShortcutEvent;
  isMacLike: boolean;
}>) => {
  if (event.key.toLowerCase() !== "b") {
    return false;
  }

  if (event.altKey || event.shiftKey) {
    return false;
  }

  if (event.metaKey && event.ctrlKey) {
    return false;
  }

  if (isMacLike) {
    return event.metaKey && !event.ctrlKey;
  }

  return event.ctrlKey && !event.metaKey;
};

const asElementTarget = (target: EventTarget | null) => {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return null;
  }

  return target;
};

const hasEditableFormControlTarget = (target: Element) =>
  target.closest("input, textarea, select") != null;

const hasEditableContentTarget = (target: Element) =>
  target.closest(editableContentSelector) != null ||
  ("isContentEditable" in target && Boolean(target.isContentEditable));

const hasEditableRoleTarget = (target: Element) =>
  target.closest(editableRoleSelector) != null;

export const isEditableShortcutTarget = (target: EventTarget | null) => {
  const elementTarget = asElementTarget(target);

  if (elementTarget == null) {
    return false;
  }

  return (
    hasEditableFormControlTarget(elementTarget) ||
    hasEditableContentTarget(elementTarget) ||
    hasEditableRoleTarget(elementTarget)
  );
};

export const handleDesktopSidebarShortcut = ({
  enabled,
  event,
  isMacLike,
  onToggle,
  isEditableTarget = isEditableShortcutTarget,
}: Readonly<{
  enabled: boolean;
  event: SidebarShortcutEvent;
  isMacLike: boolean;
  onToggle: () => void;
  isEditableTarget?: (target: EventTarget | null) => boolean;
}>) => {
  if (!enabled || event.defaultPrevented) {
    return false;
  }

  if (!isDesktopSidebarShortcut({ event, isMacLike })) {
    return false;
  }

  if (isEditableTarget(event.target)) {
    return false;
  }

  event.preventDefault();
  onToggle();
  return true;
};
