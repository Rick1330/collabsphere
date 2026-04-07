import assert from "node:assert/strict";
import test from "node:test";

import {
  queueThemeToggle,
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
