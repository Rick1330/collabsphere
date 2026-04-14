import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CollapsibleShellFrame } from "../../apps/web/src/components/shell/collapsible-shell-frame";
import { GlobalSidebarView } from "../../apps/web/src/components/shell/global-sidebar";
import { WorkspaceSidebarView } from "../../apps/web/src/components/shell/workspace-sidebar";
import {
  defaultDesktopSidebarMode,
  desktopSidebarStorageKey,
  readDesktopSidebarModeValue,
  readStoredDesktopSidebarMode,
  writeStoredDesktopSidebarMode,
} from "../../apps/web/src/lib/sidebar-state";
import type { WorkspaceSummary } from "../../apps/web/src/lib/api/workspaces";
import { repoRoot } from "./bootstrap-test-helpers";

const globalsCss = fs.readFileSync(
  path.join(repoRoot, "apps/web/src/app/globals.css"),
  "utf8",
);

const workspace: WorkspaceSummary = {
  id: "workspace-alpha",
  name: "Project Alpha",
  description: "Building the future",
  type: "professional",
  icon: "📦",
  myRole: "MEMBER",
  roleLabel: "Member",
  lastAccessedAt: "2025-07-17T12:00:00Z",
  createdAt: "2025-07-10T12:00:00Z",
};

test("sidebar state helpers use the versioned storage key and fail closed on invalid values", () => {
  const writes: Array<[string, string]> = [];

  assert.equal(readDesktopSidebarModeValue("collapsed"), "collapsed");
  assert.equal(readDesktopSidebarModeValue("expanded"), "expanded");
  assert.equal(readDesktopSidebarModeValue("broken"), defaultDesktopSidebarMode);
  assert.equal(
    readStoredDesktopSidebarMode({
      getItem: () => "collapsed",
    }),
    "collapsed",
  );
  assert.equal(
    readStoredDesktopSidebarMode({
      getItem: () => "{not-valid}",
    }),
    defaultDesktopSidebarMode,
  );
  assert.equal(
    readStoredDesktopSidebarMode({
      getItem: () => {
        throw new Error("storage unavailable");
      },
    }),
    defaultDesktopSidebarMode,
  );

  writeStoredDesktopSidebarMode(
    {
      setItem: (key, value) => {
        writes.push([key, value]);
      },
    },
    "collapsed",
  );

  assert.deepEqual(writes, [[desktopSidebarStorageKey, "collapsed"]]);
  assert.doesNotThrow(() => {
    writeStoredDesktopSidebarMode(
      {
        setItem: () => {
          throw new Error("quota exceeded");
        },
      },
      "expanded",
    );
  });
});

test("shell frame propagates a collapsed desktop sidebar state into the authenticated global rail", () => {
  const markup = renderToStaticMarkup(
    <CollapsibleShellFrame
      tone="global"
      sectionLabel="Authenticated global context"
      title="Personal workspace shell"
      description="Global post-login routes now have a stable App Router layout boundary ready for navigation, theming, and account features."
      defaultSidebarMode="collapsed"
      sidebar={<GlobalSidebarView currentPathname="/dashboard" />}
    >
      <div>Example content</div>
    </CollapsibleShellFrame>,
  );

  assert.match(markup, /data-sidebar-state="collapsed"/);
  assert.match(markup, /class="[^"]*shell__rail[^"]*global-sidebar[^"]*"/);
  assert.match(markup, /data-collapsed="true"/);
  assert.match(markup, /aria-label="Expand sidebar"/);
  assert.match(markup, /aria-controls="[^"]+"/);
  assert.match(markup, /title="Dashboard"/);
});

test("sidebar views generate stable controlled ids when a collapse handler is provided directly", () => {
  const globalMarkup = renderToStaticMarkup(
    <GlobalSidebarView currentPathname="/dashboard" onToggleCollapse={() => undefined} />,
  );
  const workspaceMarkup = renderToStaticMarkup(
    <WorkspaceSidebarView
      currentPathname="/w/workspace-alpha/tasks"
      dataState={{ kind: "loaded", workspace }}
      onToggleCollapse={() => undefined}
      workspaceId="workspace-alpha"
    />,
  );

  assert.match(globalMarkup, /id="[^"]+"/);
  assert.match(globalMarkup, /aria-controls="[^"]+"/);
  assert.match(workspaceMarkup, /id="[^"]+"/);
  assert.match(workspaceMarkup, /aria-controls="[^"]+"/);
});

test("workspace sidebar keeps collapsed controls accessible even when text labels are visually hidden", () => {
  const markup = renderToStaticMarkup(
    <WorkspaceSidebarView
      collapsed
      currentPathname="/w/workspace-alpha/tasks"
      dataState={{ kind: "loaded", workspace }}
      onToggleCollapse={() => undefined}
      sidebarId="workspace-sidebar"
      workspaceId="workspace-alpha"
    />,
  );

  assert.match(markup, /id="workspace-sidebar"/);
  assert.match(markup, /data-collapsed="true"/);
  assert.match(markup, /aria-label="Expand sidebar"/);
  assert.match(markup, /title="Back to dashboard"/);
  assert.match(markup, /title="Tasks"/);
  assert.match(markup, /title="Analytics\. Manager\+ required\."/);
});

test("globals.css defines desktop collapsed-rail rules for the authenticated sidebar variants", () => {
  assert.match(globalsCss, /@media \(width >= 1280px\)/);
  assert.match(globalsCss, /\.shell\[data-sidebar-state="collapsed"\]/);
  assert.match(globalsCss, /\.global-sidebar\[data-collapsed="true"\] \.global-sidebar__link-copy/);
  assert.match(
    globalsCss,
    /\.workspace-sidebar\[data-collapsed="true"\] \.workspace-sidebar__link-copy/,
  );
  assert.match(
    globalsCss,
    /\.workspace-sidebar\[data-collapsed="true"\] \.workspace-sidebar__back-link span:last-child/,
  );
});
