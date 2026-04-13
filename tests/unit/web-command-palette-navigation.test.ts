import assert from "node:assert/strict";
import test from "node:test";

import {
  findItemById,
  getNextGroupItemId,
  getNextSelectableItemId,
} from "../../apps/web/src/components/shell/command-palette-navigation";
import type { CommandPaletteGroup } from "../../apps/web/src/components/shell/command-palette";

const groups: CommandPaletteGroup[] = [
  {
    id: "recent",
    label: "Recent",
    items: [
      { id: "recent-disabled", label: "Disabled", disabled: true },
      { id: "recent-a", label: "A" },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    items: [{ id: "task-1", label: "Task 1" }],
  },
];

test("findItemById returns null when missing and the item when present", () => {
  assert.equal(findItemById(groups, null), null);
  assert.equal(findItemById(groups, "missing"), null);
  assert.equal(findItemById(groups, "task-1")?.label, "Task 1");
});

test("getNextSelectableItemId skips disabled items and wraps", () => {
  assert.equal(
    getNextSelectableItemId({ groups, activeItemId: null, direction: "next" }),
    "recent-a",
  );
  assert.equal(
    getNextSelectableItemId({ groups, activeItemId: "recent-a", direction: "next" }),
    "task-1",
  );
  assert.equal(
    getNextSelectableItemId({ groups, activeItemId: "task-1", direction: "next" }),
    "recent-a",
  );
  assert.equal(
    getNextSelectableItemId({ groups, activeItemId: null, direction: "previous" }),
    "task-1",
  );
});

test("getNextGroupItemId selects the first enabled item in the next/previous group", () => {
  assert.equal(getNextGroupItemId({ groups, activeItemId: null, direction: "next" }), "recent-a");
  assert.equal(
    getNextGroupItemId({ groups, activeItemId: "recent-a", direction: "next" }),
    "task-1",
  );
  assert.equal(
    getNextGroupItemId({ groups, activeItemId: "task-1", direction: "next" }),
    "recent-a",
  );
  assert.equal(
    getNextGroupItemId({ groups, activeItemId: "recent-a", direction: "previous" }),
    "task-1",
  );
});

