"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import {
  applyThemePreference,
  defaultResolvedTheme,
  getNextThemePreference,
  readStoredThemePreference,
  resolveThemePreference,
  writeStoredThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "../../lib/theme";

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

type ThemeToggleTimer = ReturnType<typeof setTimeout>;
type ThemeToggleScheduler = typeof setTimeout;
type ThemeToggleCanceller = typeof clearTimeout;

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const themeToggleDebounceMs = 200;

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

export const queueThemeToggle = (
  activeTimer: ThemeToggleTimer | null,
  commitToggle: () => void,
  scheduleToggle: ThemeToggleScheduler = setTimeout,
  cancelToggle: ThemeToggleCanceller = clearTimeout,
) => {
  if (activeTimer) {
    cancelToggle(activeTimer);
  }

  return scheduleToggle(commitToggle, themeToggleDebounceMs);
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const toggleTimerRef = useRef<ThemeToggleTimer | null>(null);
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

  useEffect(() => {
    return () => {
      if (toggleTimerRef.current) {
        clearTimeout(toggleTimerRef.current);
      }
    };
  }, []);

  const setThemePreference = (nextPreference: ThemePreference) => {
    setThemeState((currentState) => ({
      ...currentState,
      preference: nextPreference,
    }));
  };

  const toggleTheme = () => {
    toggleTimerRef.current = queueThemeToggle(toggleTimerRef.current, () => {
      setThemeState((currentState) => ({
        ...currentState,
        preference: getNextThemePreference(currentState.preference),
      }));
      toggleTimerRef.current = null;
    });
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
