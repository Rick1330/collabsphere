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

const themeValues = {
  light: "light",
  dark: "dark",
  system: "system",
} as const;

type ThemeMode = keyof typeof themeValues;
type MediaQueryApi = "modern" | "legacy";

class MemoryStorage {
  #store = new Map<string, string>();

  getItem(key: string) {
    return this.#store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.#store.set(key, value);
  }
}

class FakeMediaQueryList {
  matches: boolean;
  listener: ((event: { matches: boolean }) => void) | null = null;
  addEventListener?:
    | ((_type: "change", listener: (event: { matches: boolean }) => void) => void)
    | undefined;
  removeEventListener?:
    | ((_type: "change", listener: (event: { matches: boolean }) => void) => void)
    | undefined;
  addListener?: ((listener: (event: { matches: boolean }) => void) => void) | undefined;
  removeListener?: ((listener: (event: { matches: boolean }) => void) => void) | undefined;

  constructor(api: MediaQueryApi, matches: boolean) {
    this.matches = matches;

    if (api === "modern") {
      this.addEventListener = (_type, listener) => {
        this.listener = listener;
      };
      this.removeEventListener = (_type, listener) => {
        if (this.listener === listener) {
          this.listener = null;
        }
      };
      return;
    }

    this.addListener = (listener) => {
      this.listener = listener;
    };
    this.removeListener = (listener) => {
      if (this.listener === listener) {
        this.listener = null;
      }
    };
  }

  dispatch(nextMatches: boolean) {
    this.matches = nextMatches;
    this.listener?.({ matches: nextMatches });
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

const createWindowLike = (mediaQueryList: FakeMediaQueryList) => ({
  matchMedia(query: string) {
    assert.equal(query, systemThemeMediaQuery);
    return mediaQueryList;
  },
});

const createSubscriptionHarness = ({
  api,
  initialTheme,
}: {
  api: MediaQueryApi;
  initialTheme: ThemeMode;
}) => {
  const observedThemes: ThemeMode[] = [];
  const mediaQueryList = new FakeMediaQueryList(api, initialTheme === themeValues.dark);
  const cleanup = subscribeToSystemTheme(createWindowLike(mediaQueryList), (theme) => {
    observedThemes.push(theme);
  });

  return {
    cleanup,
    mediaQueryList,
    observedThemes,
  };
};

const assertResolvedTheme = ({
  preference,
  expected,
  systemTheme,
}: {
  preference: ThemePreference;
  expected: ThemeMode;
  systemTheme?: "light" | "dark";
}) => {
  assert.equal(resolveThemePreference(preference, systemTheme), expected);
};

test("readStoredThemePreference defaults to system when storage is empty or invalid", () => {
  const storage = new MemoryStorage();

  assert.equal(readStoredThemePreference(storage), defaultThemePreference);

  storage.setItem(themePreferenceStorageKey, "unexpected");
  assert.equal(readStoredThemePreference(storage), defaultThemePreference);
});

test("writeStoredThemePreference persists supported theme values for later reads", () => {
  const storage = new MemoryStorage();

  for (const preference of Object.values(themeValues)) {
    writeStoredThemePreference(storage, preference);
    assert.equal(readStoredThemePreference(storage), preference);
  }
});

test("resolveThemePreference keeps explicit choices and falls back to light for system", () => {
  assertResolvedTheme({ preference: themeValues.light, expected: themeValues.light });
  assertResolvedTheme({ preference: themeValues.dark, expected: themeValues.dark });
  assertResolvedTheme({
    preference: themeValues.system,
    expected: defaultResolvedTheme,
  });
  assertResolvedTheme({
    preference: themeValues.system,
    systemTheme: themeValues.dark,
    expected: themeValues.dark,
  });
  assertResolvedTheme({
    preference: themeValues.light,
    systemTheme: themeValues.dark,
    expected: themeValues.light,
  });
  assertResolvedTheme({
    preference: themeValues.dark,
    systemTheme: themeValues.light,
    expected: themeValues.dark,
  });
});

test("readSystemTheme reads the current OS preference and falls back safely", () => {
  const darkWindow = createWindowLike(new FakeMediaQueryList("modern", true));
  const lightWindow = createWindowLike(new FakeMediaQueryList("modern", false));

  const throwingWindow = {
    matchMedia() {
      throw new Error("unsupported");
    },
  };

  assert.equal(readSystemTheme(darkWindow), themeValues.dark);
  assert.equal(readSystemTheme(lightWindow), themeValues.light);
  assert.equal(readSystemTheme(throwingWindow), defaultResolvedTheme);
  assert.equal(readSystemTheme(null), defaultResolvedTheme);
});

for (const scenario of [
  {
    api: "modern",
    changeTheme: themeValues.light,
    initialTheme: themeValues.dark,
    name: "subscribeToSystemTheme reacts to modern change events and removes listeners on cleanup",
  },
  {
    api: "legacy",
    changeTheme: themeValues.dark,
    initialTheme: themeValues.light,
    name: "subscribeToSystemTheme supports legacy media-query listeners and removes them on cleanup",
  },
] as const) {
  test(scenario.name, () => {
    const { cleanup, mediaQueryList, observedThemes } = createSubscriptionHarness(scenario);

    assert.deepEqual(observedThemes, []);

    mediaQueryList.dispatch(scenario.changeTheme === themeValues.dark);
    assert.deepEqual(observedThemes, [scenario.changeTheme]);

    cleanup();
    assert.equal(mediaQueryList.listener, null);

    mediaQueryList.dispatch(scenario.initialTheme === themeValues.dark);
    assert.deepEqual(observedThemes, [scenario.changeTheme]);
  });
}

test("getNextThemePreference uses a stable light-dark-system cycle for downstream toggle UIs", () => {
  assert.equal(getNextThemePreference(themeValues.system), themeValues.light);
  assert.equal(getNextThemePreference(themeValues.light), themeValues.dark);
  assert.equal(getNextThemePreference(themeValues.dark), themeValues.system);
});

test("queueThemeToggle debounces rapid theme toggles and only keeps the latest pending commit", () => {
  let nextTimerId = 0;
  const pendingCommits = new Map<number, () => void>();
  const cancelledTimerIds: number[] = [];
  let committedPreference: ThemeMode = themeValues.system;

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
  assert.equal(committedPreference, themeValues.system);

  pendingCommits.get(2)?.();

  assert.equal(committedPreference, themeValues.light);
});

test("applyThemePreference sets dark mode attributes and color scheme explicitly", () => {
  const themeDocument = createThemeDocument();

  const resolvedTheme = applyThemePreference(themeDocument, themeValues.dark);

  assert.equal(resolvedTheme, themeValues.dark);
  assert.equal(themeDocument.documentElement.dataset.theme, themeValues.dark);
  assert.equal(themeDocument.documentElement.style.colorScheme, themeValues.dark);
});

test("applyThemePreference clears the dark attribute for light and system fallback", () => {
  const themeDocument = createThemeDocument();
  themeDocument.documentElement.dataset.theme = themeValues.dark;

  const resolvedLightTheme = applyThemePreference(themeDocument, themeValues.light);
  assert.equal(resolvedLightTheme, themeValues.light);
  assert.equal(themeDocument.documentElement.dataset.theme, undefined);
  assert.equal(themeDocument.documentElement.style.colorScheme, themeValues.light);

  themeDocument.documentElement.dataset.theme = themeValues.dark;
  const resolvedSystemTheme = applyThemePreference(themeDocument, themeValues.system);
  assert.equal(resolvedSystemTheme, themeValues.light);
  assert.equal(themeDocument.documentElement.dataset.theme, undefined);
  assert.equal(themeDocument.documentElement.style.colorScheme, themeValues.light);
});
