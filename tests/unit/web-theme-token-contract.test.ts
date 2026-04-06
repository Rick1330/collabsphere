import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const themeCss = fs.readFileSync(
  path.join(process.cwd(), "apps/web/src/styles/theme.css"),
  "utf8",
);
const globalsCss = fs.readFileSync(
  path.join(process.cwd(), "apps/web/src/app/globals.css"),
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

test("theme.css defines the exact section 3.9.3 variable names for light and dark themes", () => {
  assert.match(themeCss, /:root\s*\{/);
  assert.match(themeCss, /\[data-theme="dark"\]\s*\{/);

  for (const variableName of requiredThemeVariables) {
    const escapedName = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const declarations = themeCss.match(new RegExp(`${escapedName}\\s*:`, "g"));

    assert.ok(
      declarations && declarations.length >= 2,
      `${variableName} should be defined for light and dark themes`,
    );
  }
});

test("globals.css imports the canonical theme/token styles and removes the old ad hoc root palette", () => {
  assert.match(globalsCss, /@import "\.\.\/styles\/theme\.css";/);
  assert.match(globalsCss, /@import "\.\.\/styles\/tokens\.css";/);

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
