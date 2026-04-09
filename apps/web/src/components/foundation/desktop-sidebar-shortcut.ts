const editableRoles = new Set(["textbox", "searchbox", "combobox", "spinbutton"]);

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

export const isEditableShortcutTarget = (target: EventTarget | null) => {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }

  if (target.closest("input, textarea, select")) {
    return true;
  }

  const editableAncestor = target.closest(
    '[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]',
  );

  if (editableAncestor) {
    return true;
  }

  const roleHost = target.closest("[role]");
  const role = roleHost?.getAttribute("role")?.toLowerCase();

  if (role && editableRoles.has(role)) {
    return true;
  }

  if ("isContentEditable" in target && Boolean(target.isContentEditable)) {
    return true;
  }

  return false;
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
