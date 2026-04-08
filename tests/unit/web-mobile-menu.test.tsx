import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MobileMenu, isMobileMenuOpenKey } from "../../apps/web/src/components/foundation/mobile-menu";
import { globalNavItems } from "../../apps/web/src/components/foundation/navigation";

test("mobile menu open-key guard only allows explicit opener keys", () => {
  assert.equal(isMobileMenuOpenKey("Enter"), true);
  assert.equal(isMobileMenuOpenKey(" "), true);
  assert.equal(isMobileMenuOpenKey("ArrowDown"), true);
  assert.equal(isMobileMenuOpenKey("Escape"), false);
});

test("mobile menu renders the global navigation links when opened", () => {
  const markup = renderToStaticMarkup(
    <MobileMenu
      description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
      initialOpen
      navItems={globalNavItems}
      title="Personal workspace shell"
    />,
  );

  assert.match(markup, /aria-haspopup="dialog"/);
  assert.match(markup, /Mobile navigation/);
  assert.match(markup, /Personal workspace shell/);
  assert.match(markup, /Dashboard/);
  assert.match(markup, /Workspaces/);
  assert.match(markup, /Notifications/);
  assert.match(markup, /Settings/);
  assert.match(markup, /Close navigation menu/);
  assert.match(markup, /<dialog/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /open=""/);
});
