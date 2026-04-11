import type { CommandPaletteGroup, CommandPaletteItem } from "./command-palette";

export type CommandPaletteNavigationDirection = "next" | "previous";

type PaletteItemRef = {
  groupIndex: number;
  itemIndex: number;
  item: CommandPaletteItem;
};

const isSelectableItem = (item: CommandPaletteItem) => !item.disabled;

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
  const selectable = getSelectableItems(groups);

  if (selectable.length === 0) {
    return null;
  }

  const activeIndex = activeItemId
    ? selectable.findIndex((entry) => entry.item.id === activeItemId)
    : -1;

  if (activeIndex === -1) {
    return direction === "next"
      ? selectable[0]?.item.id ?? null
      : selectable.at(-1)?.item.id ?? null;
  }

  const delta = direction === "next" ? 1 : -1;
  const nextIndex = (activeIndex + delta + selectable.length) % selectable.length;
  return selectable[nextIndex]?.item.id ?? null;
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

const getFirstSelectableItemIdInGroup = (
  group: CommandPaletteGroup | undefined,
): string | null => {
  if (!group) {
    return null;
  }

  const match = group.items.find(isSelectableItem);
  return match?.id ?? null;
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
  if (groups.length === 0) {
    return null;
  }

  const startIndex = getGroupIndexForItemId(groups, activeItemId);

  if (startIndex == null) {
    if (direction === "next") {
      for (const group of groups) {
        const id = getFirstSelectableItemIdInGroup(group);
        if (id) {
          return id;
        }
      }

      return null;
    }

    for (let index = groups.length - 1; index >= 0; index -= 1) {
      const id = getFirstSelectableItemIdInGroup(groups[index]);
      if (id) {
        return id;
      }
    }

    return null;
  }

  const delta = direction === "next" ? 1 : -1;

  for (let offset = 1; offset <= groups.length; offset += 1) {
    const candidateIndex = (startIndex + offset * delta + groups.length) % groups.length;
    const candidateGroup = groups[candidateIndex];
    const id = getFirstSelectableItemIdInGroup(candidateGroup);
    if (id) {
      return id;
    }
  }

  return null;
};

