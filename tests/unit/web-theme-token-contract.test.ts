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

function hasImportStatement(source: string, importPath: string): boolean {
  return source
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .some(
      (line) =>
        line === `@import "${importPath}";` || line === `@import url("${importPath}");`,
    );
}

function hasCssDeclaration(block: string, propertyName: string): boolean {
  return block
    .split(";")
    .map((declaration) => declaration.trim())
    .some((declaration) => declaration.startsWith(`${propertyName}:`));
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

test("theme.css defines the exact section 3.9.3 variable names for light and dark themes", () => {
  assert.notEqual(themeCss.indexOf(":root"), -1);
  assert.notEqual(themeCss.indexOf('[data-theme="dark"]'), -1);
  assert.ok(lightThemeBlock, "expected :root theme block to exist");
  assert.ok(darkThemeBlock, 'expected [data-theme="dark"] theme block to exist');

  for (const variableName of requiredThemeVariables) {
    assert.ok(
      hasCssDeclaration(lightThemeBlock, variableName),
      `${variableName} should be defined in the light theme block`,
    );
    assert.ok(
      hasCssDeclaration(darkThemeBlock, variableName),
      `${variableName} should be defined in the dark theme block`,
    );
  }
});

test("globals.css imports the canonical theme/token styles and removes the old ad hoc root palette", () => {
  assert.ok(hasImportStatement(globalsCss, "../styles/theme.css"));
  assert.ok(hasImportStatement(globalsCss, "../styles/tokens.css"));

  for (const removedVariable of [
    "--page-bg",
    "--surface:",
    "--surface-strong",
    "--surface-border",
    "--text:",
    "--text-muted",
  ]) {
    assert.equal(globalsCss.includes(removedVariable), false);
  }

  assert.ok(globalsCss.includes("var(--color-bg-primary)"));
  assert.ok(globalsCss.includes("var(--color-text-primary)"));
  assert.ok(globalsCss.includes("var(--color-accent)"));
});

test("globals.css preserves shell state selectors while leaving migrated rail layout ownership in components", () => {
  const shellRailRule = getCssBlock(globalsCss, ".shell__rail::before");

  assert.ok(shellRailRule, "expected .shell__rail::before rule to exist");
  assert.equal(hasCssDeclaration(shellRailRule, "display"), false);
  assert.equal(hasCssDeclaration(shellRailRule, "gap"), false);
  assert.equal(hasCssDeclaration(shellRailRule, "align-content"), false);

  for (const removedRootSelector of [
    ".shell__rail--default",
    ".global-sidebar",
    ".workspace-sidebar",
  ]) {
    assert.equal(
      new RegExp(`(^|\\n)${removedRootSelector.replace(".", "\\.")}\\s*\\{`, "m").test(globalsCss),
      false,
      `${removedRootSelector} root layout rule should not remain in globals.css`,
    );
  }

  for (const retainedStateSelector of [
    '.global-sidebar[data-collapsed="true"]',
    '.workspace-sidebar[data-collapsed="true"]',
    '.shell[data-sidebar-state="collapsed"]',
  ]) {
    assert.ok(
      globalsCss.includes(retainedStateSelector),
      `${retainedStateSelector} state selector should stay in globals.css`,
    );
  }
});
