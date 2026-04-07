import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { repoRoot } from "./bootstrap-test-helpers";

const themeCss = fs.readFileSync(
  path.join(repoRoot, "apps/web/src/styles/theme.css"),
  "utf8",
);
const globalsCss = fs.readFileSync(
  path.join(repoRoot, "apps/web/src/app/globals.css"),
  "utf8",
);

const requiredThemeVariables = [
  "--color-bg-primary",
  "--color-bg-secondary",
  "--color-bg-tertiary",
  "--color-text-primary",
  "--color-text-secondary",
  "--color-text-tertiary",
  "--color-border",
  "--color-accent",
  "--color-accent-hover",
  "--color-success",
  "--color-warning",
  "--color-error",
  "--color-info",
];

const lightThemeBlock = themeCss.match(/:root\s*\{([\s\S]*?)\}/)?.[1];
const darkThemeBlock = themeCss.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)?.[1];
const importThemePattern = /^\s*@import\s+(?:url\()?['"]\.\.\/styles\/theme\.css['"]\)?;?/m;
const importTokensPattern = /^\s*@import\s+(?:url\()?['"]\.\.\/styles\/tokens\.css['"]\)?;?/m;

test("theme.css defines the exact section 3.9.3 variable names for light and dark themes", () => {
  assert.match(themeCss, /:root\s*\{/);
  assert.match(themeCss, /\[data-theme="dark"\]\s*\{/);
  assert.ok(lightThemeBlock, "expected :root theme block to exist");
  assert.ok(darkThemeBlock, 'expected [data-theme="dark"] theme block to exist');

  for (const variableName of requiredThemeVariables) {
    const escapedName = variableName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

    assert.match(
      lightThemeBlock,
      new RegExp(String.raw`${escapedName}\s*:`),
      `${variableName} should be defined in the light theme block`,
    );
    assert.match(
      darkThemeBlock,
      new RegExp(String.raw`${escapedName}\s*:`),
      `${variableName} should be defined in the dark theme block`,
    );
  }
});

test("globals.css imports the canonical theme/token styles and removes the old ad hoc root palette", () => {
  assert.match(globalsCss, importThemePattern);
  assert.match(globalsCss, importTokensPattern);

  for (const removedVariable of [
    "--page-bg",
    "--surface:",
    "--surface-strong",
    "--surface-border",
    "--text:",
    "--text-muted",
  ]) {
    assert.doesNotMatch(globalsCss, new RegExp(removedVariable));
  }

  assert.match(globalsCss, /var\(--color-bg-primary\)/);
  assert.match(globalsCss, /var\(--color-text-primary\)/);
  assert.match(globalsCss, /var\(--color-accent\)/);
});
