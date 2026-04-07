export const themePreferenceStorageKey = "collabsphere.theme-preference";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;
type ThemeRootElement = {
  dataset: Record<string, string | undefined>;
  style: {
    colorScheme: string;
  };
};
type ThemeDocument = {
  documentElement: ThemeRootElement;
};

export const defaultThemePreference: ThemePreference = "system";
export const defaultResolvedTheme: ResolvedTheme = "light";

export const isThemePreference = (value: string | null | undefined): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

export const readStoredThemePreference = (storage?: ThemeStorage | null): ThemePreference => {
  if (!storage) {
    return defaultThemePreference;
  }

  try {
    const storedValue = storage.getItem(themePreferenceStorageKey);
    return isThemePreference(storedValue) ? storedValue : defaultThemePreference;
  } catch {
    return defaultThemePreference;
  }
};

export const writeStoredThemePreference = (
  storage: ThemeStorage | null | undefined,
  preference: ThemePreference,
) => {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(themePreferenceStorageKey, preference);
  } catch {
    // Storage access can fail in privacy-restricted contexts; keep the UI responsive.
  }
};

export const resolveThemePreference = (
  preference: ThemePreference,
  systemTheme: ResolvedTheme = defaultResolvedTheme,
): ResolvedTheme => (preference === "system" ? systemTheme : preference);

export const applyThemePreference = (
  documentLike: ThemeDocument | null | undefined,
  preference: ThemePreference,
  systemTheme: ResolvedTheme = defaultResolvedTheme,
) => {
  const resolvedTheme = resolveThemePreference(preference, systemTheme);
  const root = documentLike?.documentElement;

  if (!root) {
    return resolvedTheme;
  }

  if (resolvedTheme === "dark") {
    root.dataset.theme = "dark";
  } else {
    delete root.dataset.theme;
  }

  root.style.colorScheme = resolvedTheme;

  return resolvedTheme;
};
