import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppProviders } from "../../apps/web/src/components/providers/app-providers";
import { ShellFrame } from "../../apps/web/src/components/foundation/shell-frame";
import { globalNavItems } from "../../apps/web/src/components/foundation/navigation";
import { TopNavBar } from "../../apps/web/src/components/foundation/top-nav-bar";
import { ThemeUserMenu } from "../../apps/web/src/components/foundation/user-theme-menu";
import { WorkspaceSwitcherMenu } from "../../apps/web/src/components/foundation/workspace-switcher";

const workspaceState = {
  kind: "loaded" as const,
  workspaces: [
    {
      id: "workspace-alpha",
      name: "Project Alpha",
      description: "Launch preparation",
      type: "professional" as const,
      icon: "📦",
      myRole: "MANAGER" as const,
      roleLabel: "Tech Lead",
      lastAccessedAt: "2025-07-17T12:00:00Z",
      createdAt: "2025-07-10T12:00:00Z",
    },
  ],
};

test("top nav renders authenticated shell regions with a real workspace switcher and staged controls", () => {
  const markup = renderToStaticMarkup(
    <AppProviders>
      <TopNavBar
        workspaceSwitcher={
          <WorkspaceSwitcherMenu
            currentWorkspaceId="workspace-alpha"
            dataState={workspaceState}
          />
        }
        userMenu={<ThemeUserMenu />}
      />
    </AppProviders>,
  );

  assert.match(markup, /aria-label="Authenticated top navigation"/);
  assert.match(markup, /href="\/dashboard"/);
  assert.match(markup, /CollabSphere/);
  assert.match(markup, /Project Alpha/);
  assert.match(markup, /Current workspace · Tech Lead/);
  assert.match(markup, /Search placeholder/);
  assert.match(markup, /Notifications placeholder/);
  assert.match(markup, /role="search"/);
  assert.match(markup, /Ctrl/);
  assert.match(markup, /Feed soon/);
  assert.match(markup, /aria-haspopup="menu"/);
});

test("shell frame renders the top nav before the supporting header copy", () => {
  const markup = renderToStaticMarkup(
    <AppProviders>
      <ShellFrame
        tone="global"
        sectionLabel="Authenticated global context"
        title="Personal workspace shell"
        description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
        navItems={globalNavItems}
        topNav={
          <TopNavBar
            workspaceSwitcher={
              <WorkspaceSwitcherMenu
                currentWorkspaceId={null}
                dataState={workspaceState}
              />
            }
            userMenu={<ThemeUserMenu />}
          />
        }
      >
        <div>Example content</div>
      </ShellFrame>
    </AppProviders>,
  );

  const topNavIndex = markup.indexOf('class="top-nav"');
  const headerIndex = markup.indexOf('class="shell__header');

  assert.ok(topNavIndex !== -1 && headerIndex !== -1 && topNavIndex < headerIndex);
  assert.match(markup, /class="shell__content shell__content--with-top-nav"/);
  assert.match(markup, /role="group" aria-label="Notification and account controls"/);
});

test("shell frame keeps the default content layout class when no top nav is provided", () => {
  const markup = renderToStaticMarkup(
    <AppProviders>
      <ShellFrame
        tone="global"
        sectionLabel="Authenticated global context"
        title="Personal workspace shell"
        description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
        navItems={globalNavItems}
      >
        <div>Example content</div>
      </ShellFrame>
    </AppProviders>,
  );

  assert.match(markup, /class="shell__content"/);
  assert.doesNotMatch(markup, /shell__content--with-top-nav/);
});
