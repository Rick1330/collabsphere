import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MobileMenu, isMobileMenuOpenKey } from "../../apps/web/src/components/foundation/mobile-menu";
import {
  getMobileSidebarSwipeAction,
  isMobileSidebarOpenGestureStart,
} from "../../apps/web/src/components/foundation/mobile-sidebar-swipe";
import { globalNavItems } from "../../apps/web/src/components/foundation/navigation";
import { repoRoot } from "./bootstrap-test-helpers";

const globalsCss = fs.readFileSync(
  path.join(repoRoot, "apps/web/src/app/globals.css"),
  "utf8",
);

test("mobile menu open-key guard only allows explicit opener keys", () => {
  assert.equal(isMobileMenuOpenKey("Enter"), true);
  assert.equal(isMobileMenuOpenKey(" "), true);
  assert.equal(isMobileMenuOpenKey("ArrowDown"), true);
  assert.equal(isMobileMenuOpenKey("Escape"), false);
});

test("mobile sidebar swipe helper opens from the left edge and closes from the panel", () => {
  assert.equal(isMobileSidebarOpenGestureStart(24), true);
  assert.equal(isMobileSidebarOpenGestureStart(40), false);

  assert.equal(
    getMobileSidebarSwipeAction({
      endX: 140,
      endY: 20,
      isOpen: false,
      panelWidth: 390,
      startX: 12,
      startY: 18,
      viewportWidth: 390,
    }),
    "open",
  );
  assert.equal(
    getMobileSidebarSwipeAction({
      endX: 88,
      endY: 22,
      isOpen: true,
      panelWidth: 390,
      startX: 188,
      startY: 18,
      viewportWidth: 390,
    }),
    "close",
  );
});

test("mobile sidebar swipe helper rejects short, vertical, and off-edge gestures", () => {
  assert.equal(
    getMobileSidebarSwipeAction({
      endX: 70,
      endY: 24,
      isOpen: false,
      panelWidth: 390,
      startX: 12,
      startY: 18,
      viewportWidth: 390,
    }),
    null,
  );
  assert.equal(
    getMobileSidebarSwipeAction({
      endX: 132,
      endY: 90,
      isOpen: false,
      panelWidth: 390,
      startX: 12,
      startY: 18,
      viewportWidth: 390,
    }),
    null,
  );
  assert.equal(
    getMobileSidebarSwipeAction({
      endX: 160,
      endY: 24,
      isOpen: false,
      panelWidth: 390,
      startX: 52,
      startY: 18,
      viewportWidth: 390,
    }),
    null,
  );
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
  assert.match(markup, /role="dialog"/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /open=""/);
});

test("globals.css keeps the mobile slide-over full-width and touch targets above 44px", () => {
  assert.match(globalsCss, /\.top-nav__hamburger \{/);
  assert.match(globalsCss, /width: 3\.2rem;/);
  assert.match(globalsCss, /height: 3\.2rem;/);
  assert.match(globalsCss, /\.mobile-menu__close \{/);
  assert.match(globalsCss, /width: 2\.85rem;/);
  assert.match(globalsCss, /height: 2\.85rem;/);
  assert.match(globalsCss, /@media \(width <= 767px\) \{/);
  assert.match(globalsCss, /\.mobile-menu__panel \{/);
  assert.match(globalsCss, /width: 100vw;/);
});
