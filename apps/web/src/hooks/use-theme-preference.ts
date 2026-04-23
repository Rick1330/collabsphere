import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "cs-theme-preference";

function getSystemTheme(): ResolvedTheme {
  if (typeof globalThis.window === "undefined") return "light";
  return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readPreference(): ThemePreference {
  if (typeof globalThis.window === "undefined") return "system";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readPreference());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  // Track system theme changes
  useEffect(() => {
    if (typeof globalThis.window === "undefined") return;
    const mql = globalThis.window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: ResolvedTheme = preference === "system" ? systemTheme : preference;

  // Apply to <html> whenever it resolves
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    if (typeof globalThis.window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return { preference, resolvedTheme, setPreference };
}

/**
 * Apply the persisted preference once at app boot, before React renders,
 * so the first paint matches the user's choice (no light flash in dark mode).
 */
export function bootstrapThemePreference() {
  const pref = readPreference();
  const resolved: ResolvedTheme = pref === "system" ? getSystemTheme() : pref;
  applyTheme(resolved);
}
