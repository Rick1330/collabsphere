import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { WorkspaceSummary } from "../../apps/web/src/lib/api/workspaces";
import {
  getWorkspaceInitials,
  getWorkspaceRoleGateLabel,
  isWorkspaceRoleAllowed,
  isWorkspaceSidebarItemActive,
  workspaceSidebarPrimaryItems,
} from "../../apps/web/src/components/shell/navigation";
import { WorkspaceSidebarView } from "../../apps/web/src/components/shell/workspace-sidebar";

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

test("workspace sidebar helpers classify route activity and role gates deterministically", () => {
  assert.equal(
    isWorkspaceSidebarItemActive(
      "/w/workspace-alpha/documents/abc",
      workspaceSidebarPrimaryItems("workspace-alpha")[1],
    ),
    true,
  );
  assert.equal(isWorkspaceRoleAllowed("MEMBER", "MANAGER"), false);
  assert.equal(isWorkspaceRoleAllowed("OWNER", "ADMIN"), true);
  assert.equal(getWorkspaceRoleGateLabel("MANAGER"), "Manager+");
  assert.equal(getWorkspaceRoleGateLabel("ADMIN"), "Admin+");
  assert.equal(getWorkspaceInitials(workspace), "📦");
});

test("workspace sidebar renders core workspace routes and locked elevated routes for member roles", () => {
  const markup = renderToStaticMarkup(
    <WorkspaceSidebarView
      currentPathname="/w/workspace-alpha/tasks"
      dataState={{ kind: "loaded", workspace }}
      workspaceId="workspace-alpha"
    />,
  );

  assert.match(markup, /aria-label="Workspace navigation"/);
  assert.match(markup, /aria-labelledby="workspace-sidebar-workspace"/);
  assert.match(markup, /aria-labelledby="workspace-sidebar-elevated-routes"/);
  assert.match(markup, /aria-labelledby="workspace-sidebar-quick-actions"/);
  assert.match(markup, /Back to dashboard/);
  assert.match(markup, /Project Alpha/);
  assert.match(markup, /Building the future/);
  assert.match(markup, /Member/);
  assert.match(markup, /href="\/w\/workspace-alpha"/);
  assert.match(markup, /href="\/w\/workspace-alpha\/documents"/);
  assert.match(markup, /href="\/w\/workspace-alpha\/tasks"/);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /Analytics/);
  assert.match(markup, /Manager\+/);
  assert.match(markup, /Settings/);
  assert.match(markup, /Admin\+/);
  assert.match(markup, /New Document/);
  assert.match(markup, /New Task/);
});

test("workspace sidebar keeps elevated routes locked while membership context is loading or missing", () => {
  const loadingMarkup = renderToStaticMarkup(
    <WorkspaceSidebarView
      currentPathname="/w/workspace-alpha"
      dataState={{ kind: "loading" }}
      workspaceId="workspace-alpha"
    />,
  );
  const missingMarkup = renderToStaticMarkup(
    <WorkspaceSidebarView
      currentPathname="/w/workspace-alpha"
      dataState={{ kind: "missing" }}
      workspaceId="workspace-alpha"
    />,
  );
  const managerMarkup = renderToStaticMarkup(
    <WorkspaceSidebarView
      currentPathname="/w/workspace-alpha"
      dataState={{
        kind: "loaded",
        workspace: {
          ...workspace,
          myRole: "MANAGER",
          roleLabel: "Manager",
        },
      }}
      workspaceId="workspace-alpha"
    />,
  );

  assert.match(loadingMarkup, /Checking workspace membership/);
  assert.match(missingMarkup, /Workspace membership not confirmed/);
  assert.match(
    managerMarkup,
    /Your role allows this route, but the page is not implemented yet/,
  );
  assert.match(managerMarkup, /Analytics/);
  assert.match(managerMarkup, /Soon/);
});
