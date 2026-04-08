import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { GlobalSidebarView } from "../../apps/web/src/components/foundation/global-sidebar";
import {
  globalSidebarActionItems,
  globalSidebarPrimaryItems,
  isGlobalSidebarItemActive,
} from "../../apps/web/src/components/foundation/navigation";
import { ShellFrame } from "../../apps/web/src/components/foundation/shell-frame";

test("global sidebar route matching keeps settings descendants active without overmatching peers", () => {
  assert.equal(
    isGlobalSidebarItemActive("/settings/profile", globalSidebarPrimaryItems[3]),
    true,
  );
  assert.equal(
    isGlobalSidebarItemActive("/workspaces/new", globalSidebarPrimaryItems[1]),
    false,
  );
  assert.equal(
    isGlobalSidebarItemActive("/workspaces/new", globalSidebarActionItems[0]),
    true,
  );
  assert.equal(
    isGlobalSidebarItemActive("/dashboard/analytics", globalSidebarPrimaryItems[0]),
    false,
  );
});

test("global sidebar renders required global routes, action CTA, and active-state semantics", () => {
  const markup = renderToStaticMarkup(
    <GlobalSidebarView currentPathname="/settings/profile" />,
  );

  assert.match(markup, /aria-label="Global navigation"/);
  assert.match(markup, /href="\/dashboard"/);
  assert.match(markup, /href="\/workspaces"/);
  assert.match(markup, /href="\/notifications"/);
  assert.match(markup, /href="\/settings"/);
  assert.match(markup, /href="\/workspaces\/new"/);
  assert.match(markup, /Recent workspaces/);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /data-active="true"/);
});

test("shell frame can render a custom sidebar in place of the generic rail", () => {
  const markup = renderToStaticMarkup(
    <ShellFrame
      tone="global"
      sectionLabel="Authenticated global context"
      title="Personal workspace shell"
      description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
      sidebar={<GlobalSidebarView currentPathname="/dashboard" />}
    >
      <div>Example content</div>
    </ShellFrame>,
  );

  assert.match(markup, /class="shell__rail global-sidebar"/);
  assert.match(markup, /aria-current="page" href="\/dashboard"/);
  assert.doesNotMatch(markup, /Authenticated global context navigation/);
});

test("shell frame honors an explicit null sidebar instead of falling back to the default rail", () => {
  const markup = renderToStaticMarkup(
    <ShellFrame
      tone="global"
      sectionLabel="Authenticated global context"
      title="Personal workspace shell"
      description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
      navItems={globalSidebarPrimaryItems.map((item) => ({
        href: item.href,
        hint: item.description,
        label: item.label,
      }))}
      sidebar={null}
    >
      <div>Example content</div>
    </ShellFrame>,
  );

  assert.doesNotMatch(markup, /class="shell__rail"/);
  assert.match(markup, /class="shell shell--global shell--no-rail"/);
  assert.doesNotMatch(markup, /Authenticated global context navigation/);
});

test("shell frame keeps the structured default rail layout when no custom sidebar is supplied", () => {
  const markup = renderToStaticMarkup(
    <ShellFrame
      tone="public"
      sectionLabel="Public context"
      title="CollabSphere"
      description="Public shell"
      navItems={[
        {
          href: "/",
          hint: "Landing route",
          label: "Landing",
        },
      ]}
    >
      <div>Public content</div>
    </ShellFrame>,
  );

  assert.match(markup, /class="shell__rail shell__rail--default"/);
  assert.doesNotMatch(markup, /shell--no-rail/);
});
