import type { CommandPaletteGroup, CommandPaletteItem } from "./command-palette";

export type CommandPaletteNavigationDirection = "next" | "previous";

type PaletteItemRef = {
  groupIndex: number;
  itemIndex: number;
  item: CommandPaletteItem;
};

const isSelectableItem = (item: CommandPaletteItem) => !item.disabled;

type PaletteGroupRef = {
  groupIndex: number;
  firstItemId: string;
};

export const getSelectableItems = (groups: readonly CommandPaletteGroup[]) => {
  const items: PaletteItemRef[] = [];

  groups.forEach((group, groupIndex) => {
    group.items.forEach((item, itemIndex) => {
      if (!isSelectableItem(item)) {
        return;
      }

      items.push({ groupIndex, itemIndex, item });
    });
  });

  return items;
};

const getSelectableGroups = (groups: readonly CommandPaletteGroup[]) => {
  const selectable: PaletteGroupRef[] = [];

  groups.forEach((group, groupIndex) => {
    const firstItemId = group.items.find(isSelectableItem)?.id;
    if (!firstItemId) {
      return;
    }

    selectable.push({ groupIndex, firstItemId });
  });

  return selectable;
};

export const findItemById = (
  groups: readonly CommandPaletteGroup[],
  itemId: string | null,
): CommandPaletteItem | null => {
  if (!itemId) {
    return null;
  }

  for (const group of groups) {
    const match = group.items.find((item) => item.id === itemId);
    if (match) {
      return match;
    }
  }

  return null;
};

export const getNextSelectableItemId = ({
  activeItemId,
  direction,
  groups,
}: Readonly<{
  groups: readonly CommandPaletteGroup[];
  activeItemId: string | null;
  direction: CommandPaletteNavigationDirection;
}>) => {
  const selectable = getSelectableItems(groups).map((entry) => entry.item.id);

  if (selectable.length === 0) {
    return null;
  }

  const activeIndex = activeItemId ? selectable.indexOf(activeItemId) : -1;
  const delta = direction === "next" ? 1 : -1;
  const baseIndex = activeIndex >= 0 ? activeIndex : direction === "next" ? -1 : 0;
  const nextIndex = (baseIndex + delta + selectable.length) % selectable.length;
  return selectable[nextIndex] ?? null;
};

const getGroupIndexForItemId = (groups: readonly CommandPaletteGroup[], itemId: string | null) => {
  if (!itemId) {
    return null;
  }

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    if (groups[groupIndex]?.items.some((item) => item.id === itemId)) {
      return groupIndex;
    }
  }

  return null;
};

export const getNextGroupItemId = ({
  activeItemId,
  direction,
  groups,
}: Readonly<{
  groups: readonly CommandPaletteGroup[];
  activeItemId: string | null;
  direction: CommandPaletteNavigationDirection;
}>) => {
  const selectableGroups = getSelectableGroups(groups);

  if (selectableGroups.length === 0) {
    return null;
  }

  const activeGroupIndex = getGroupIndexForItemId(groups, activeItemId);
  let activePosition =
    activeGroupIndex == null
      ? -1
      : selectableGroups.findIndex((entry) => entry.groupIndex === activeGroupIndex);

  if (activePosition < 0) {
    activePosition = direction === "next" ? -1 : 0;
  }

  const delta = direction === "next" ? 1 : -1;
  const nextPosition = (activePosition + delta + selectableGroups.length) % selectableGroups.length;
  return selectableGroups[nextPosition]?.firstItemId ?? null;
};
