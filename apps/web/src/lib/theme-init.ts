import {
  defaultResolvedTheme,
  readThemePreferenceValue,
  resolveThemePreference,
  systemThemeMediaQuery,
  themePreferenceStorageKey,
  type ResolvedTheme,
} from "./theme";

type ThemeInitOptions = {
  storedPreference: string | null | undefined;
  systemPrefersDark: boolean;
};

const themeInitConfig = {
  dark: "dark",
  light: "light",
  mediaQuery: systemThemeMediaQuery,
  storageKey: themePreferenceStorageKey,
  system: "system",
} as const;

export const resolvePrepaintTheme = ({
  storedPreference,
  systemPrefersDark,
}: ThemeInitOptions): ResolvedTheme =>
  resolveThemePreference(
    readThemePreferenceValue(storedPreference),
    systemPrefersDark ? themeInitConfig.dark : themeInitConfig.light,
  );

export const themePrepaintScript = `(()=>{const root=document.documentElement;const config=${JSON.stringify(themeInitConfig)};let preference=config.system;try{const stored=window.localStorage.getItem(config.storageKey);if(stored===config.light||stored===config.dark||stored===config.system){preference=stored;}}catch{}let systemPrefersDark=${JSON.stringify(defaultResolvedTheme === themeInitConfig.dark)};try{systemPrefersDark=window.matchMedia(config.mediaQuery).matches===true;}catch{}const resolved=preference===config.dark||(preference===config.system&&systemPrefersDark)?config.dark:config.light;if(resolved===config.dark){root.dataset.theme=config.dark;}else{root.removeAttribute("data-theme");}root.style.colorScheme=resolved;})();`;
