import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppProviders } from "../../apps/web/src/components/providers/app-providers";
import { ShellFrame } from "../../apps/web/src/components/foundation/shell-frame";
import {
  getThemeMenuOpenIndex,
  getThemeMenuNextIndex,
  getThemeMenuStatusLabel,
  isThemeMenuNavigationKey,
  ThemeUserMenu,
  themeMenuOptions,
} from "../../apps/web/src/components/foundation/user-theme-menu";
import { globalNavItems } from "../../apps/web/src/components/foundation/navigation";

test("theme user menu status label reflects system and manual preferences", () => {
  assert.equal(getThemeMenuStatusLabel("system", "dark"), "System · following dark");
  assert.equal(getThemeMenuStatusLabel("light", "dark"), "Light locked");
  assert.equal(getThemeMenuStatusLabel("dark", "light"), "Dark locked");
});

test("theme user menu navigation wraps predictably across the full action list", () => {
  const actionCount = themeMenuOptions.length + 3;

  assert.equal(getThemeMenuNextIndex(0, "ArrowUp", actionCount), actionCount - 1);
  assert.equal(getThemeMenuNextIndex(actionCount - 1, "ArrowDown", actionCount), 0);
  assert.equal(getThemeMenuNextIndex(2, "Home", actionCount), 0);
  assert.equal(getThemeMenuNextIndex(1, "End", actionCount), actionCount - 1);
  assert.equal(getThemeMenuNextIndex(0, "PageDown", actionCount), actionCount - 1);
});

test("theme user menu trigger opening respects first-item and arrow-up last-item behavior", () => {
  const actionCount = themeMenuOptions.length + 3;

  assert.equal(getThemeMenuOpenIndex("Enter", 0, actionCount), 0);
  assert.equal(getThemeMenuOpenIndex("ArrowUp", 0, actionCount), actionCount - 1);
  assert.equal(getThemeMenuOpenIndex("ArrowDown", -1, actionCount), 0);
});

test("theme user menu navigation-key guard narrows supported roving keys", () => {
  assert.equal(isThemeMenuNavigationKey("ArrowDown"), true);
  assert.equal(isThemeMenuNavigationKey("PageUp"), true);
  assert.equal(isThemeMenuNavigationKey("Tab"), false);
});

test("theme user menu renders an accessible closed trigger inside the shell header", () => {
  const markup = renderToStaticMarkup(
    <AppProviders>
      <ShellFrame
        tone="global"
        sectionLabel="Authenticated global context"
        title="Personal workspace shell"
        description="Theme menu host"
        navItems={globalNavItems}
        headerAction={<ThemeUserMenu />}
      >
        <div>Example content</div>
      </ShellFrame>
    </AppProviders>,
  );

  assert.match(markup, /aria-haspopup="menu"/);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /CollabSphere member/);
  assert.match(markup, /Account menu/);
});

test("public shell frame does not render the authenticated theme menu by default", () => {
  const markup = renderToStaticMarkup(
    <ShellFrame
      tone="public"
      sectionLabel="Public context"
      title="CollabSphere"
      description="Public shell"
      navItems={[]}
    >
      <div>Public content</div>
    </ShellFrame>,
  );

  assert.doesNotMatch(markup, /aria-haspopup="menu"/);
});

test("theme user menu renders account links, theme options, and sign-out action when opened", () => {
  const markup = renderToStaticMarkup(
    <AppProviders>
      <ThemeUserMenu initialOpen />
    </AppProviders>,
  );

  assert.match(markup, /role="menu"/);
  assert.equal((markup.match(/role="menuitem"/g) ?? []).length, 3);
  assert.equal((markup.match(/role="menuitemradio"/g) ?? []).length, 3);
  assert.match(markup, /Account shortcuts/);
  assert.match(markup, /Dashboard/);
  assert.match(markup, /Settings/);
  assert.match(markup, /Display theme/);
  assert.match(markup, /Session/);
  assert.match(markup, /Sign out/);
  assert.match(markup, /Profile, email, and role details will appear here/);
  assert.match(markup, /Shell/);
  assert.match(markup, /aria-checked="true"/);
});
