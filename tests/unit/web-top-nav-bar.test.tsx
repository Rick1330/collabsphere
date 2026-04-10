import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { GlobalSidebarView } from "../../apps/web/src/components/foundation/global-sidebar";
import { AppProviders } from "../../apps/web/src/components/providers/app-providers";
import { globalNavItems } from "../../apps/web/src/components/foundation/navigation";
import { NotificationBellMenu } from "../../apps/web/src/components/foundation/notification-bell";
import { ShellFrame } from "../../apps/web/src/components/foundation/shell-frame";
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

test("top nav renders authenticated shell regions with a live workspace switcher and staged controls", () => {
  const markup = renderToStaticMarkup(
    <AppProviders>
      <TopNavBar
        mobileMenuDescription="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
        mobileMenuTitle="Personal workspace shell"
        mobileNavItems={globalNavItems}
        notificationBell={
          <NotificationBellMenu
            unreadCount={12}
            dataState={{
              kind: "loaded",
              notifications: [
                {
                  id: "notif-alpha",
                  type: "task.assigned",
                  workspaceId: "workspace-alpha",
                  title: "Task assigned to you",
                  body: "Implement the notification bell dropdown.",
                  url: "/w/workspace-alpha/tasks/notif-alpha",
                  isRead: false,
                  createdAt: "2025-07-17T12:00:00Z",
                },
              ],
            }}
          />
        }
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
  assert.match(markup, /Open command palette/);
  assert.match(markup, /top-nav__search top-nav__search--desktop-only/);
  assert.match(markup, /aria-haspopup="dialog"/);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /Notifications/);
  assert.match(markup, /12 unread in your recent feed/);
  assert.match(markup, /Open navigation menu/);
  assert.match(markup, /role="search"/);
  assert.match(markup, /Ctrl/);
  assert.match(markup, /aria-haspopup="menu"/);
});

test("top nav can render an initially open command palette in the authenticated shell", () => {
  const markup = renderToStaticMarkup(
    <AppProviders>
      <TopNavBar
        commandPaletteInitialOpen
        mobileMenuDescription="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
        mobileMenuTitle="Personal workspace shell"
        mobileNavItems={globalNavItems}
        notificationBell={
          <NotificationBellMenu
            unreadCount={0}
            dataState={{ kind: "empty" }}
          />
        }
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

  assert.match(markup, /aria-expanded="true"/);
  assert.match(markup, /aria-controls="command-palette-/);
  assert.match(markup, /<dialog/);
  assert.match(markup, /Command palette/);
  assert.match(markup, /Search commands/);
  assert.match(markup, /open=""/);
});

test("shell frame renders the top nav before the supporting header copy", () => {
  const markup = renderToStaticMarkup(
    <AppProviders>
      <ShellFrame
        tone="global"
        sectionLabel="Authenticated global context"
        title="Personal workspace shell"
        description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
        sidebar={<GlobalSidebarView currentPathname="/dashboard" />}
        topNav={
          <TopNavBar
            mobileMenuDescription="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
            mobileMenuTitle="Personal workspace shell"
            mobileNavItems={globalNavItems}
            notificationBell={
              <NotificationBellMenu
                unreadCount={0}
                dataState={{ kind: "empty" }}
              />
            }
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
  assert.match(markup, /class="shell shell--global shell--has-top-nav"/);
  assert.match(markup, /class="shell__rail global-sidebar"/);
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
