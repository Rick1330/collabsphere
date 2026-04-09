export const desktopSidebarStorageKey = "collabsphere.desktop-sidebar.v1";

export type DesktopSidebarMode = "expanded" | "collapsed";

type SidebarReadStorage = Pick<Storage, "getItem">;
type SidebarWriteStorage = Pick<Storage, "setItem">;

export const defaultDesktopSidebarMode: DesktopSidebarMode = "expanded";

export const isDesktopSidebarMode = (
  value: string | null | undefined,
): value is DesktopSidebarMode => value === "expanded" || value === "collapsed";

export const readDesktopSidebarModeValue = (
  value: string | null | undefined,
): DesktopSidebarMode =>
  isDesktopSidebarMode(value) ? value : defaultDesktopSidebarMode;

export const readStoredDesktopSidebarMode = (
  storage?: SidebarReadStorage | null,
): DesktopSidebarMode => {
  if (!storage) {
    return defaultDesktopSidebarMode;
  }

  try {
    return readDesktopSidebarModeValue(storage.getItem(desktopSidebarStorageKey));
  } catch {
    return defaultDesktopSidebarMode;
  }
};

export const writeStoredDesktopSidebarMode = (
  storage: SidebarWriteStorage | null | undefined,
  mode: DesktopSidebarMode,
) => {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(desktopSidebarStorageKey, mode);
  } catch {
    // Storage access can fail in privacy-restricted contexts; keep the shell usable.
  }
};
