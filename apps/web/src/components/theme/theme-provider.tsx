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
  defaultThemePreference,
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

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getInitialThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return defaultThemePreference;
  }

  return readStoredThemePreference(window.localStorage);
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [preference, setThemePreference] = useState<ThemePreference>(getInitialThemePreference);
  const resolvedTheme = resolveThemePreference(preference);

  useEffect(() => {
    applyThemePreference(document, preference);
    writeStoredThemePreference(window.localStorage, preference);
  }, [preference]);

  const toggleTheme = () => {
    setThemePreference((currentPreference) =>
      resolveThemePreference(currentPreference) === "dark" ? "light" : "dark",
    );
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
