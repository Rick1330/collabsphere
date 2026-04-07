"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import {
  applyThemePreference,
  defaultResolvedTheme,
  defaultThemePreference,
  getNextThemePreference,
  readStoredThemePreference,
  resolveThemePreference,
  writeStoredThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

type ThemeProviderState = {
  preference: ThemePreference;
  systemTheme: ResolvedTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getSafeLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getInitialThemePreference = (): ThemePreference => {
  return readStoredThemePreference(getSafeLocalStorage());
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [themeState, setThemeState] = useState<ThemeProviderState>(() => ({
    preference: getInitialThemePreference(),
    systemTheme: defaultResolvedTheme,
  }));
  const { preference, systemTheme } = themeState;
  const resolvedTheme = resolveThemePreference(preference, systemTheme);

  useEffect(() => {
    applyThemePreference(document, preference, systemTheme);
    writeStoredThemePreference(getSafeLocalStorage(), preference);
  }, [preference, systemTheme]);

  const setThemePreference = (nextPreference: ThemePreference) => {
    setThemeState((currentState) => ({
      ...currentState,
      preference: nextPreference,
    }));
  };

  const toggleTheme = () => {
    setThemeState((currentState) => ({
      ...currentState,
      preference: getNextThemePreference(currentState.preference),
    }));
  };

  return (
    <ThemeContext.Provider
      value={{
        preference,
        resolvedTheme,
        setThemePreference,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return value;
};
