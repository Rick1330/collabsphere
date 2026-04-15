import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  resolvePrepaintTheme,
  themePrepaintScript,
} from "../../apps/web/src/lib/theme-init";
import {
  applyThemePreference,
  systemThemeMediaQuery,
  themePreferenceStorageKey,
} from "../../apps/web/src/lib/theme";
import { repoRoot } from "./bootstrap-test-helpers";

const rootLayoutSource = fs.readFileSync(
  path.join(repoRoot, "apps/web/src/app/layout.tsx"),
  "utf8",
);

const createThemeRoot = () => ({
  dataset: {} as Record<string, string | undefined>,
  style: {
    colorScheme: "",
  },
  removeAttribute(name: string) {
    if (name === "data-theme") {
      delete this.dataset.theme;
    }
  },
});

test("resolvePrepaintTheme keeps the pre-paint contract aligned with runtime theme rules", () => {
  assert.equal(
    resolvePrepaintTheme({ storedPreference: "light", systemPrefersDark: true }),
    "light",
  );
  assert.equal(
    resolvePrepaintTheme({ storedPreference: "dark", systemPrefersDark: false }),
    "dark",
  );
  assert.equal(
    resolvePrepaintTheme({ storedPreference: "system", systemPrefersDark: true }),
    "dark",
  );
  assert.equal(
    resolvePrepaintTheme({ storedPreference: "system", systemPrefersDark: false }),
    "light",
  );
  assert.equal(
    resolvePrepaintTheme({ storedPreference: "unexpected", systemPrefersDark: true }),
    "dark",
  );
});

for (const scenario of [
  {
    expectedColorScheme: "dark",
    expectedDataTheme: "dark",
    name: "pre-paint script applies stored dark preference before hydration",
    storedPreference: "dark",
    systemPrefersDark: false,
  },
  {
    expectedColorScheme: "light",
    expectedDataTheme: undefined,
    name: "pre-paint script applies stored light preference before hydration",
    storedPreference: "light",
    systemPrefersDark: true,
  },
  {
    expectedColorScheme: "dark",
    expectedDataTheme: "dark",
    name: "pre-paint script follows dark OS preference when stored preference is system",
    storedPreference: "system",
    systemPrefersDark: true,
  },
  {
    expectedColorScheme: "dark",
    expectedDataTheme: "dark",
    name: "pre-paint script follows OS preference when storage access throws",
    storedPreference: null,
    systemPrefersDark: true,
    throwsOnStorageAccess: true,
  },
  {
    expectedColorScheme: "dark",
    expectedDataTheme: "dark",
    name: "pre-paint script preserves stored dark preference when matchMedia throws",
    storedPreference: "dark",
    systemPrefersDark: false,
    throwsOnMatchMedia: true,
  },
  {
    expectedColorScheme: "light",
    expectedDataTheme: undefined,
    name: "pre-paint script falls back to light when both storage and matchMedia are unavailable",
    storedPreference: null,
    systemPrefersDark: false,
    throwsOnMatchMedia: true,
    throwsOnStorageAccess: true,
  },
] as const) {
  test(scenario.name, () => {
    const root = createThemeRoot();
    const resolvedTheme = resolvePrepaintTheme({
      storedPreference: scenario.throwsOnStorageAccess ? null : scenario.storedPreference,
      systemPrefersDark:
        scenario.throwsOnMatchMedia ? false : scenario.systemPrefersDark,
    });
    applyThemePreference({ documentElement: root }, resolvedTheme);

    assert.equal(root.dataset.theme, scenario.expectedDataTheme);
    assert.equal(root.style.colorScheme, scenario.expectedColorScheme);
  });
}

test("pre-paint script stays deterministic and free of unsafe dynamic execution", () => {
  assert.doesNotMatch(themePrepaintScript, /\beval\b/);
  assert.doesNotMatch(themePrepaintScript, /\bnew Function\b/);
  assert.match(themePrepaintScript, /localStorage\.getItem/);
  assert.match(themePrepaintScript, /matchMedia/);
  assert.match(themePrepaintScript, /root\.style\.colorScheme=resolved/);
  assert.match(themePrepaintScript, /root\.removeAttribute\("data-theme"\)/);
  assert.match(themePrepaintScript, /root\.dataset\.theme=config\.dark/);
  assert.match(themePrepaintScript, new RegExp(themePreferenceStorageKey.replace(".", "\\.")));
  assert.match(themePrepaintScript, new RegExp(systemThemeMediaQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("root layout injects the pre-paint script ahead of the themed body and suppresses html hydration drift", () => {
  assert.match(rootLayoutSource, /<html lang="en" suppressHydrationWarning>/);
  assert.match(rootLayoutSource, /<head>/);
  assert.match(rootLayoutSource, /id="theme-prepaint-init"/);
  assert.match(rootLayoutSource, /themePrepaintScript/);
  assert.match(rootLayoutSource, /<body className=\{`.*app-shell-root`\}>/);
  assert.match(rootLayoutSource, /Manrope/);
  assert.match(rootLayoutSource, /JetBrains_Mono/);
  assert.match(rootLayoutSource, /<AppProviders>/);
  const scriptIndex = rootLayoutSource.indexOf('id="theme-prepaint-init"');
  const bodyIndex = rootLayoutSource.indexOf("<body className");
  assert.ok(scriptIndex !== -1 && bodyIndex !== -1 && scriptIndex < bodyIndex);
});
