import {
  isEditableShortcutTarget,
  isMacLikePlatform,
} from "./desktop-sidebar-shortcut";

type CommandPaletteShortcutEvent = Pick<
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

const isCommandPaletteKey = (key: string) => key.toLowerCase() === "k";
const getActiveModifierCount = (event: CommandPaletteShortcutEvent) =>
  Number(event.metaKey) +
  Number(event.ctrlKey) +
  Number(event.altKey) +
  Number(event.shiftKey);

export { isMacLikePlatform };

export const isCommandPaletteShortcut = ({
  event,
  isMacLike,
}: Readonly<{
  event: CommandPaletteShortcutEvent;
  isMacLike: boolean;
}>) => {
  if (!isCommandPaletteKey(event.key) || getActiveModifierCount(event) !== 1) {
    return false;
  }

  return isMacLike ? event.metaKey : event.ctrlKey;
};

export const handleCommandPaletteShortcut = ({
  enabled,
  event,
  isEditableTarget = isEditableShortcutTarget,
  isMacLike,
  isOpen,
  onOpen,
  onRefocusInput,
}: Readonly<{
  enabled: boolean;
  event: CommandPaletteShortcutEvent;
  isEditableTarget?: (target: EventTarget | null) => boolean;
  isMacLike: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onRefocusInput: () => void;
}>) => {
  if (!enabled || event.defaultPrevented) {
    return false;
  }

  if (!isCommandPaletteShortcut({ event, isMacLike })) {
    return false;
  }

  if (isEditableTarget(event.target)) {
    return false;
  }

  event.preventDefault();

  if (isOpen) {
    onRefocusInput();
  } else {
    onOpen();
  }

  return true;
};

