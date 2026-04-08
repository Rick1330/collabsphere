import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ShellFrame } from "../../apps/web/src/components/foundation/shell-frame";
import { globalNavItems } from "../../apps/web/src/components/foundation/navigation";
import { TopNavBar } from "../../apps/web/src/components/foundation/top-nav-bar";
import { ThemeProvider } from "../../apps/web/src/components/theme/theme-provider";
import { ThemeUserMenu } from "../../apps/web/src/components/foundation/user-theme-menu";

test("top nav renders the authenticated shell control regions with truthful placeholder labels", () => {
  const markup = renderToStaticMarkup(
    <ThemeProvider>
      <TopNavBar userMenu={<ThemeUserMenu />} />
    </ThemeProvider>,
  );

  assert.match(markup, /aria-label="Authenticated top navigation"/);
  assert.match(markup, /href="\/dashboard"/);
  assert.match(markup, /CollabSphere/);
  assert.match(markup, /Workspace switcher placeholder/);
  assert.match(markup, /Search placeholder/);
  assert.match(markup, /Notifications placeholder/);
  assert.match(markup, /role="search"/);
  assert.match(markup, /Ctrl/);
  assert.match(markup, /Feed soon/);
  assert.match(markup, /aria-haspopup="menu"/);
});

test("shell frame renders the top nav before the supporting header copy", () => {
  const markup = renderToStaticMarkup(
    <ThemeProvider>
      <ShellFrame
        tone="global"
        sectionLabel="Authenticated global context"
        title="Personal workspace shell"
        description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
        navItems={globalNavItems}
        topNav={<TopNavBar userMenu={<ThemeUserMenu />} />}
      >
        <div>Example content</div>
      </ShellFrame>
    </ThemeProvider>,
  );

  const topNavIndex = markup.indexOf('class="top-nav"');
  const headerIndex = markup.indexOf('class="shell__header');

  assert.ok(topNavIndex !== -1 && headerIndex !== -1 && topNavIndex < headerIndex);
  assert.match(markup, /role="group" aria-label="Notification and account controls"/);
});
