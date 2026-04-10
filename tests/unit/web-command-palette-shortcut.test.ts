import assert from "node:assert/strict";
import test from "node:test";

import {
  handleCommandPaletteShortcut,
  isCommandPaletteShortcut,
} from "../../apps/web/src/components/foundation/command-palette-shortcut";

const createShortcutEvent = ({
  altKey = false,
  ctrlKey = false,
  defaultPrevented = false,
  key = "k",
  metaKey = false,
  shiftKey = false,
  target = null,
}: Partial<{
  altKey: boolean;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
  target: EventTarget | null;
}> = {}) => {
  let prevented = false;

  return {
    event: {
      altKey,
      ctrlKey,
      defaultPrevented,
      key,
      metaKey,
      preventDefault: () => {
        prevented = true;
      },
      shiftKey,
      target,
    },
    wasPrevented: () => prevented,
  };
};

test("command palette shortcut detection respects platform modifier", () => {
  const nonMacMatch = createShortcutEvent({ ctrlKey: true });
  const macMatch = createShortcutEvent({ metaKey: true });
  const wrongModifier = createShortcutEvent({ altKey: true });

  assert.equal(
    isCommandPaletteShortcut({ event: nonMacMatch.event, isMacLike: false }),
    true,
  );
  assert.equal(isCommandPaletteShortcut({ event: macMatch.event, isMacLike: true }), true);
  assert.equal(
    isCommandPaletteShortcut({ event: wrongModifier.event, isMacLike: false }),
    false,
  );
});

test("command palette shortcut ignores editable targets", () => {
  const shortcut = createShortcutEvent({ ctrlKey: true });
  let openCount = 0;
  let refocusCount = 0;

  const handled = handleCommandPaletteShortcut({
    enabled: true,
    event: shortcut.event,
    isEditableTarget: () => true,
    isMacLike: false,
    isOpen: false,
    onOpen: () => {
      openCount += 1;
    },
    onRefocusInput: () => {
      refocusCount += 1;
    },
  });

  assert.equal(handled, false);
  assert.equal(shortcut.wasPrevented(), false);
  assert.equal(openCount, 0);
  assert.equal(refocusCount, 0);
});

test("command palette shortcut opens when closed and refocuses when already open", () => {
  const openShortcut = createShortcutEvent({ ctrlKey: true });
  const refocusShortcut = createShortcutEvent({ ctrlKey: true });
  let openCount = 0;
  let refocusCount = 0;

  assert.equal(
    handleCommandPaletteShortcut({
      enabled: true,
      event: openShortcut.event,
      isMacLike: false,
      isOpen: false,
      onOpen: () => {
        openCount += 1;
      },
      onRefocusInput: () => {
        refocusCount += 1;
      },
    }),
    true,
  );
  assert.equal(openShortcut.wasPrevented(), true);
  assert.equal(openCount, 1);
  assert.equal(refocusCount, 0);

  assert.equal(
    handleCommandPaletteShortcut({
      enabled: true,
      event: refocusShortcut.event,
      isMacLike: false,
      isOpen: true,
      onOpen: () => {
        openCount += 1;
      },
      onRefocusInput: () => {
        refocusCount += 1;
      },
    }),
    true,
  );
  assert.equal(refocusShortcut.wasPrevented(), true);
  assert.equal(openCount, 1);
  assert.equal(refocusCount, 1);
});

