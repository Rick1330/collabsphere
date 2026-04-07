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

export const themePrepaintScript = `(()=>{const root=document.documentElement;const config=${JSON.stringify(themeInitConfig)};let resolved=${JSON.stringify(defaultResolvedTheme)};try{const stored=window.localStorage.getItem(config.storageKey);const preference=stored===config.light||stored===config.dark||stored===config.system?stored:config.system;const systemPrefersDark=window.matchMedia(config.mediaQuery).matches===true;resolved=preference===config.dark||(preference===config.system&&systemPrefersDark)?config.dark:config.light;}catch{}if(resolved===config.dark){root.dataset.theme=config.dark;}else{root.removeAttribute("data-theme");}root.style.colorScheme=resolved;})();`;
