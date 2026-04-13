import assert from "node:assert/strict";
import test from "node:test";

import {
  handleDesktopSidebarShortcut,
  isDesktopSidebarShortcut,
  isMacLikePlatform,
} from "../../apps/web/src/components/shell/desktop-sidebar-shortcut";

type ShortcutEventStub = {
  altKey: boolean;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  key: string;
  metaKey: boolean;
  preventDefault: () => void;
  shiftKey: boolean;
  target: EventTarget | null;
};

const createShortcutEvent = (
  overrides: Partial<Omit<ShortcutEventStub, "preventDefault">> = {},
) => {
  let preventDefaultCalls = 0;
  const event: ShortcutEventStub = {
    altKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    key: "b",
    metaKey: false,
    shiftKey: false,
    target: null,
    ...overrides,
    preventDefault: () => {
      preventDefaultCalls += 1;
      event.defaultPrevented = true;
    },
  };

  return {
    event,
    getPreventDefaultCalls: () => preventDefaultCalls,
  };
};

test("platform detection keeps Cmd for Apple platforms and Ctrl for others", () => {
  assert.equal(isMacLikePlatform({ platform: "MacIntel", userAgent: "Mozilla" }), true);
  assert.equal(isMacLikePlatform({ platform: "Win32", userAgent: "Mozilla" }), false);
});

test("shortcut matcher accepts Cmd+B on mac and Ctrl+B on non-mac", () => {
  const cmdEvent = createShortcutEvent({ key: "B", metaKey: true }).event;
  const ctrlEvent = createShortcutEvent({ ctrlKey: true }).event;

  assert.equal(isDesktopSidebarShortcut({ event: cmdEvent, isMacLike: true }), true);
  assert.equal(isDesktopSidebarShortcut({ event: cmdEvent, isMacLike: false }), false);
  assert.equal(isDesktopSidebarShortcut({ event: ctrlEvent, isMacLike: false }), true);
  assert.equal(isDesktopSidebarShortcut({ event: ctrlEvent, isMacLike: true }), false);
});

test("shortcut matcher rejects unsupported modifier combinations", () => {
  assert.equal(
    isDesktopSidebarShortcut({
      event: createShortcutEvent({ metaKey: true, shiftKey: true }).event,
      isMacLike: true,
    }),
    false,
  );
  assert.equal(
    isDesktopSidebarShortcut({
      event: createShortcutEvent({ ctrlKey: true, altKey: true }).event,
      isMacLike: false,
    }),
    false,
  );
  assert.equal(
    isDesktopSidebarShortcut({
      event: createShortcutEvent({ ctrlKey: true, metaKey: true }).event,
      isMacLike: false,
    }),
    false,
  );
  assert.equal(
    isDesktopSidebarShortcut({
      event: createShortcutEvent({ key: "k", ctrlKey: true }).event,
      isMacLike: false,
    }),
    false,
  );
});

test("shortcut handler toggles and prevents default only when actually handled", () => {
  const toggles: number[] = [];
  const handledEvent = createShortcutEvent({ ctrlKey: true });
  const ignoredEvent = createShortcutEvent({ ctrlKey: true, defaultPrevented: true });

  assert.equal(
    handleDesktopSidebarShortcut({
      enabled: true,
      event: handledEvent.event,
      isMacLike: false,
      onToggle: () => {
        toggles.push(1);
      },
    }),
    true,
  );
  assert.equal(handledEvent.getPreventDefaultCalls(), 1);
  assert.equal(toggles.length, 1);

  assert.equal(
    handleDesktopSidebarShortcut({
      enabled: true,
      event: ignoredEvent.event,
      isMacLike: false,
      onToggle: () => {
        toggles.push(1);
      },
    }),
    false,
  );
  assert.equal(ignoredEvent.getPreventDefaultCalls(), 0);
  assert.equal(toggles.length, 1);
});

test("shortcut handler ignores editable contexts and disabled mode", () => {
  const toggles: number[] = [];
  const editableEvent = createShortcutEvent({ metaKey: true, target: {} as EventTarget });
  const disabledEvent = createShortcutEvent({ metaKey: true });

  assert.equal(
    handleDesktopSidebarShortcut({
      enabled: true,
      event: editableEvent.event,
      isMacLike: true,
      onToggle: () => {
        toggles.push(1);
      },
      isEditableTarget: () => true,
    }),
    false,
  );
  assert.equal(editableEvent.getPreventDefaultCalls(), 0);

  assert.equal(
    handleDesktopSidebarShortcut({
      enabled: false,
      event: disabledEvent.event,
      isMacLike: true,
      onToggle: () => {
        toggles.push(1);
      },
      isEditableTarget: () => false,
    }),
    false,
  );
  assert.equal(disabledEvent.getPreventDefaultCalls(), 0);
  assert.equal(toggles.length, 0);
});
