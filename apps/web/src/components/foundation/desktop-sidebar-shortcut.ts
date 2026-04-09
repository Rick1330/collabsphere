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

const isSidebarToggleKey = (key: string) => key.toLowerCase() === "b";
const getActiveModifierCount = (event: SidebarShortcutEvent) =>
  Number(event.metaKey) +
  Number(event.ctrlKey) +
  Number(event.altKey) +
  Number(event.shiftKey);

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
  if (!isSidebarToggleKey(event.key) || getActiveModifierCount(event) !== 1) {
    return false;
  }

  return isMacLike ? event.metaKey : event.ctrlKey;
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
