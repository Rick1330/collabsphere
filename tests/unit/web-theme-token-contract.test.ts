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

function getCssBlock(source: string, selector: string): string | undefined {
  const selectorIndex = source.indexOf(selector);
  if (selectorIndex === -1) {
    return undefined;
  }

  const blockStart = source.indexOf("{", selectorIndex);
  if (blockStart === -1) {
    return undefined;
  }

  let depth = 0;
  for (let index = blockStart; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") {
      depth += 1;
      continue;
    }
    if (character !== "}") {
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return source.slice(blockStart + 1, index);
    }
  }

  return undefined;
}

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

const lightThemeBlock = getCssBlock(themeCss, ":root");
const darkThemeBlock = getCssBlock(themeCss, '[data-theme="dark"]');
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

test("globals.css keeps grid sidebar layout scoped to the concrete sidebar variants", () => {
  const shellRailRule = globalsCss.match(/\.shell__rail\s*\{([\s\S]*?)\}/)?.[1];
  const defaultRailRule = globalsCss.match(/\.shell__rail--default\s*\{([\s\S]*?)\}/)?.[1];
  const globalSidebarRule = globalsCss.match(/\.global-sidebar\s*\{([\s\S]*?)\}/)?.[1];
  const workspaceSidebarRule = globalsCss.match(/\.workspace-sidebar\s*\{([\s\S]*?)\}/)?.[1];

  assert.ok(shellRailRule, "expected .shell__rail rule to exist");
  assert.ok(defaultRailRule, "expected .shell__rail--default rule to exist");
  assert.ok(globalSidebarRule, "expected .global-sidebar rule to exist");
  assert.ok(workspaceSidebarRule, "expected .workspace-sidebar rule to exist");

  assert.doesNotMatch(shellRailRule, /display:\s*grid/);
  assert.doesNotMatch(shellRailRule, /gap:\s*1\.5rem/);
  assert.doesNotMatch(shellRailRule, /align-content:\s*start/);
  assert.match(defaultRailRule, /display:\s*grid/);
  assert.match(defaultRailRule, /gap:\s*1\.5rem/);
  assert.match(defaultRailRule, /align-content:\s*start/);
  assert.match(globalSidebarRule, /display:\s*grid/);
  assert.match(globalSidebarRule, /align-content:\s*start/);
  assert.match(workspaceSidebarRule, /display:\s*grid/);
  assert.match(workspaceSidebarRule, /align-content:\s*start/);
});
