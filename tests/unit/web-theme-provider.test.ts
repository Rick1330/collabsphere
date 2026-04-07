import assert from "node:assert/strict";
import test from "node:test";

import {
  queueThemeToggle,
  readSystemTheme,
  subscribeToSystemTheme,
  systemThemeMediaQuery,
  themeToggleDebounceMs,
} from "../../apps/web/src/components/theme/theme-provider";
import {
  applyThemePreference,
  defaultResolvedTheme,
  defaultThemePreference,
  getNextThemePreference,
  readStoredThemePreference,
  resolveThemePreference,
  themePreferenceStorageKey,
  writeStoredThemePreference,
  type ThemePreference,
} from "../../apps/web/src/lib/theme";

class MemoryStorage {
  #store = new Map<string, string>();

  getItem(key: string) {
    return this.#store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.#store.set(key, value);
  }
}

class ModernMediaQueryList {
  matches: boolean;
  listener: ((event: { matches: boolean }) => void) | null = null;

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_type: "change", listener: (event: { matches: boolean }) => void) {
    this.listener = listener;
  }

  removeEventListener(_type: "change", listener: (event: { matches: boolean }) => void) {
    if (this.listener === listener) {
      this.listener = null;
    }
  }

  dispatch(matches: boolean) {
    this.matches = matches;
    this.listener?.({ matches });
  }
}

class LegacyMediaQueryList {
  matches: boolean;
  listener: ((event: { matches: boolean }) => void) | null = null;

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addListener(listener: (event: { matches: boolean }) => void) {
    this.listener = listener;
  }

  removeListener(listener: (event: { matches: boolean }) => void) {
    if (this.listener === listener) {
      this.listener = null;
    }
  }

  dispatch(matches: boolean) {
    this.matches = matches;
    this.listener?.({ matches });
  }
}

const createThemeDocument = () => ({
  documentElement: {
    dataset: {} as Record<string, string | undefined>,
    style: {
      colorScheme: "",
    },
    removeAttribute(name: string) {
      if (name === "data-theme") {
        delete this.dataset.theme;
      }
    },
  },
});

test("readStoredThemePreference defaults to system when storage is empty or invalid", () => {
  const storage = new MemoryStorage();

  assert.equal(readStoredThemePreference(storage), defaultThemePreference);

  storage.setItem(themePreferenceStorageKey, "unexpected");
  assert.equal(readStoredThemePreference(storage), defaultThemePreference);
});

test("writeStoredThemePreference persists supported theme values for later reads", () => {
  const storage = new MemoryStorage();

  for (const preference of ["light", "dark", "system"] satisfies ThemePreference[]) {
    writeStoredThemePreference(storage, preference);
    assert.equal(readStoredThemePreference(storage), preference);
  }
});

test("resolveThemePreference keeps explicit choices and falls back to light for system", () => {
  assert.equal(resolveThemePreference("light"), "light");
  assert.equal(resolveThemePreference("dark"), "dark");
  assert.equal(resolveThemePreference("system"), defaultResolvedTheme);
  assert.equal(resolveThemePreference("system", "dark"), "dark");
  assert.equal(resolveThemePreference("light", "dark"), "light");
  assert.equal(resolveThemePreference("dark", "light"), "dark");
});

test("readSystemTheme reads the current OS preference and falls back safely", () => {
  const darkWindow = {
    matchMedia(query: string) {
      assert.equal(query, systemThemeMediaQuery);
      return new ModernMediaQueryList(true);
    },
  };

  const lightWindow = {
    matchMedia(query: string) {
      assert.equal(query, systemThemeMediaQuery);
      return new ModernMediaQueryList(false);
    },
  };

  const throwingWindow = {
    matchMedia() {
      throw new Error("unsupported");
    },
  };

  assert.equal(readSystemTheme(darkWindow), "dark");
  assert.equal(readSystemTheme(lightWindow), "light");
  assert.equal(readSystemTheme(throwingWindow), defaultResolvedTheme);
  assert.equal(readSystemTheme(null), defaultResolvedTheme);
});

test("subscribeToSystemTheme initializes from matchMedia and reacts to modern change events", () => {
  const observedThemes: string[] = [];
  const mediaQueryList = new ModernMediaQueryList(true);
  const windowLike = {
    matchMedia(query: string) {
      assert.equal(query, systemThemeMediaQuery);
      return mediaQueryList;
    },
  };

  const cleanup = subscribeToSystemTheme(windowLike, (theme) => {
    observedThemes.push(theme);
  });

  assert.deepEqual(observedThemes, ["dark"]);

  mediaQueryList.dispatch(false);
  assert.deepEqual(observedThemes, ["dark", "light"]);

  cleanup();
  assert.equal(mediaQueryList.listener, null);
});

test("subscribeToSystemTheme supports legacy media-query listeners and removes them on cleanup", () => {
  const observedThemes: string[] = [];
  const mediaQueryList = new LegacyMediaQueryList(false);
  const windowLike = {
    matchMedia(query: string) {
      assert.equal(query, systemThemeMediaQuery);
      return mediaQueryList;
    },
  };

  const cleanup = subscribeToSystemTheme(windowLike, (theme) => {
    observedThemes.push(theme);
  });

  assert.deepEqual(observedThemes, ["light"]);

  mediaQueryList.dispatch(true);
  assert.deepEqual(observedThemes, ["light", "dark"]);

  cleanup();
  assert.equal(mediaQueryList.listener, null);
});

test("getNextThemePreference uses a stable light-dark-system cycle for downstream toggle UIs", () => {
  assert.equal(getNextThemePreference("system"), "light");
  assert.equal(getNextThemePreference("light"), "dark");
  assert.equal(getNextThemePreference("dark"), "system");
});

test("queueThemeToggle debounces rapid theme toggles and only keeps the latest pending commit", () => {
  let nextTimerId = 0;
  const pendingCommits = new Map<number, () => void>();
  const cancelledTimerIds: number[] = [];
  let committedPreference = "system";

  const scheduleToggle = ((callback: () => void, delay?: number) => {
    assert.equal(delay, themeToggleDebounceMs);

    nextTimerId += 1;
    pendingCommits.set(nextTimerId, callback);

    return nextTimerId as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;

  const cancelToggle = ((timer: ReturnType<typeof setTimeout>) => {
    const timerId = timer as unknown as number;
    cancelledTimerIds.push(timerId);
    pendingCommits.delete(timerId);
  }) as typeof clearTimeout;

  let activeTimer = queueThemeToggle(
    null,
    () => {
      committedPreference = getNextThemePreference(committedPreference);
    },
    scheduleToggle,
    cancelToggle,
  );

  activeTimer = queueThemeToggle(
    activeTimer,
    () => {
      committedPreference = getNextThemePreference(committedPreference);
    },
    scheduleToggle,
    cancelToggle,
  );

  assert.deepEqual(cancelledTimerIds, [1]);
  assert.deepEqual([...pendingCommits.keys()], [2]);
  assert.equal(committedPreference, "system");

  pendingCommits.get(2)?.();

  assert.equal(committedPreference, "light");
});

test("applyThemePreference sets dark mode attributes and color scheme explicitly", () => {
  const themeDocument = createThemeDocument();

  const resolvedTheme = applyThemePreference(themeDocument, "dark");

  assert.equal(resolvedTheme, "dark");
  assert.equal(themeDocument.documentElement.dataset.theme, "dark");
  assert.equal(themeDocument.documentElement.style.colorScheme, "dark");
});

test("applyThemePreference clears the dark attribute for light and system fallback", () => {
  const themeDocument = createThemeDocument();
  themeDocument.documentElement.dataset.theme = "dark";

  const resolvedLightTheme = applyThemePreference(themeDocument, "light");
  assert.equal(resolvedLightTheme, "light");
  assert.equal(themeDocument.documentElement.dataset.theme, undefined);
  assert.equal(themeDocument.documentElement.style.colorScheme, "light");

  themeDocument.documentElement.dataset.theme = "dark";
  const resolvedSystemTheme = applyThemePreference(themeDocument, "system");
  assert.equal(resolvedSystemTheme, "light");
  assert.equal(themeDocument.documentElement.dataset.theme, undefined);
  assert.equal(themeDocument.documentElement.style.colorScheme, "light");
});
