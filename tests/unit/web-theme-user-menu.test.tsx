import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ShellFrame } from "../../apps/web/src/components/foundation/shell-frame";
import {
  getThemeMenuNextIndex,
  getThemeMenuStatusLabel,
  ThemeUserMenu,
  themeMenuOptions,
} from "../../apps/web/src/components/foundation/user-theme-menu";
import { globalNavItems } from "../../apps/web/src/components/foundation/navigation";
import { ThemeProvider } from "../../apps/web/src/components/theme/theme-provider";

test("theme user menu status label reflects system and manual preferences", () => {
  assert.equal(getThemeMenuStatusLabel("system", "dark"), "System · following dark");
  assert.equal(getThemeMenuStatusLabel("light", "dark"), "Light locked");
  assert.equal(getThemeMenuStatusLabel("dark", "light"), "Dark locked");
});

test("theme user menu navigation wraps predictably across menu options", () => {
  assert.equal(getThemeMenuNextIndex(0, "ArrowUp", themeMenuOptions.length), 2);
  assert.equal(getThemeMenuNextIndex(2, "ArrowDown", themeMenuOptions.length), 0);
  assert.equal(getThemeMenuNextIndex(1, "Home", themeMenuOptions.length), 0);
  assert.equal(getThemeMenuNextIndex(1, "End", themeMenuOptions.length), 2);
  assert.equal(getThemeMenuNextIndex(0, "PageDown", themeMenuOptions.length), 2);
});

test("theme user menu renders an accessible closed trigger inside the shell header", () => {
  const markup = renderToStaticMarkup(
    <ThemeProvider>
      <ShellFrame
        tone="global"
        sectionLabel="Authenticated global context"
        title="Personal workspace shell"
        description="Theme menu host"
        navItems={globalNavItems}
      >
        <div>Example content</div>
      </ShellFrame>
    </ThemeProvider>,
  );

  assert.match(markup, /aria-haspopup="menu"/);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /CollabSphere member/);
  assert.match(markup, /System · following light/);
});

test("theme user menu renders three menuitemradio options when opened", () => {
  const markup = renderToStaticMarkup(
    <ThemeProvider>
      <ThemeUserMenu initialOpen />
    </ThemeProvider>,
  );

  assert.match(markup, /role="menu"/);
  assert.equal((markup.match(/role="menuitemradio"/g) ?? []).length, 3);
  assert.match(markup, /Display theme/);
  assert.match(markup, /Theme preference stored locally on this device/);
  assert.match(markup, /aria-checked="true"/);
});
