"use client";

import * as React from "react";
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
  systemThemeMediaQuery,
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

type ThemeMediaQueryListLike = {
  matches: boolean;
  addEventListener?: (
    type: "change",
    listener: (event: ThemeMediaQueryChangeEventLike) => void,
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: (event: ThemeMediaQueryChangeEventLike) => void,
  ) => void;
  addListener?: (listener: (event: ThemeMediaQueryChangeEventLike) => void) => void;
  removeListener?: (listener: (event: ThemeMediaQueryChangeEventLike) => void) => void;
};

type ThemeMediaQueryChangeEventLike = Pick<ThemeMediaQueryListLike, "matches">;
type ThemeMediaQueryWindow = Pick<Window, "matchMedia">;
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

export const resolveSystemTheme = (
  mediaQueryList: ThemeMediaQueryChangeEventLike | null | undefined,
): ResolvedTheme => (mediaQueryList?.matches ? "dark" : "light");

export const readSystemTheme = (
  windowLike: ThemeMediaQueryWindow | null | undefined,
): ResolvedTheme => {
  if (!windowLike) {
    return defaultResolvedTheme;
  }

  try {
    return resolveSystemTheme(windowLike.matchMedia(systemThemeMediaQuery));
  } catch {
    return defaultResolvedTheme;
  }
};

export const subscribeToSystemTheme = (
  windowLike: ThemeMediaQueryWindow | null | undefined,
  onSystemThemeChange: (theme: ResolvedTheme) => void,
) => {
  if (!windowLike) {
    return () => {};
  }

  try {
    const mediaQueryList = windowLike.matchMedia(systemThemeMediaQuery);
    const handleChange = (event: ThemeMediaQueryChangeEventLike) => {
      onSystemThemeChange(resolveSystemTheme(event));
    };

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);

      return () => {
        mediaQueryList.removeEventListener?.("change", handleChange);
      };
    }

    if (typeof mediaQueryList.addListener === "function") {
      mediaQueryList.addListener(handleChange);

      return () => {
        mediaQueryList.removeListener?.(handleChange);
      };
    }
  } catch {
    return () => {};
  }

  return () => {};
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
    systemTheme:
      typeof window === "undefined" ? defaultResolvedTheme : readSystemTheme(window),
  }));
  const { preference, systemTheme } = themeState;
  const resolvedTheme = resolveThemePreference(preference, systemTheme);

  useEffect(() => {
    applyThemePreference(document, preference, systemTheme);
  }, [preference, systemTheme]);

  useEffect(() => {
    writeStoredThemePreference(getSafeLocalStorage(), preference);
  }, [preference]);

  useEffect(() => {
    return subscribeToSystemTheme(
      typeof window === "undefined" ? null : window,
      (nextSystemTheme) => {
        setThemeState((currentState) => {
          if (currentState.systemTheme === nextSystemTheme) {
            return currentState;
          }

          return {
            ...currentState,
            systemTheme: nextSystemTheme,
          };
        });
      },
    );
  }, []);

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
