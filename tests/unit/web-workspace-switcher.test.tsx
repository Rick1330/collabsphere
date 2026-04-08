import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  WorkspaceSwitcherMenu,
  getCurrentWorkspaceIdFromPathname,
  getWorkspaceMenuNextIndex,
  getWorkspaceMenuOpenIndex,
  getWorkspaceTriggerCopy,
  isWorkspaceMenuNavigationKey,
  isWorkspaceMenuOpenKey,
} from "../../apps/web/src/components/foundation/workspace-switcher";
import {
  parseWorkspaceListResponse,
  sortWorkspacesForSwitcher,
  type WorkspaceSummary,
} from "../../apps/web/src/lib/api/workspaces";

const workspaceFixtures: WorkspaceSummary[] = [
  {
    id: "workspace-bravo",
    name: "Bravo Research",
    description: "Academic study",
    type: "academic",
    icon: "🧪",
    myRole: "MEMBER",
    roleLabel: "Contributor",
    lastAccessedAt: "2025-07-17T10:00:00Z",
    createdAt: "2025-07-10T12:00:00Z",
  },
  {
    id: "workspace-alpha",
    name: "Alpha Launch",
    description: "Launch room",
    type: "professional",
    icon: "📦",
    myRole: "MANAGER",
    roleLabel: "Tech Lead",
    lastAccessedAt: "2025-07-17T12:00:00Z",
    createdAt: "2025-07-11T12:00:00Z",
  },
  {
    id: "workspace-charlie",
    name: "Charlie Ops",
    description: "General planning",
    type: "general",
    icon: null,
    myRole: "VIEWER",
    roleLabel: "Viewer",
    lastAccessedAt: "2025-07-17T12:00:00Z",
    createdAt: "2025-07-09T12:00:00Z",
  },
];

test("sortWorkspacesForSwitcher orders by lastAccessedAt descending then name", () => {
  const sorted = sortWorkspacesForSwitcher(workspaceFixtures);

  assert.deepEqual(
    sorted.map((workspace) => workspace.id),
    ["workspace-alpha", "workspace-charlie", "workspace-bravo"],
  );
});

test("parseWorkspaceListResponse enforces the documented list envelope", () => {
  const parsed = parseWorkspaceListResponse({
    data: {
      items: workspaceFixtures,
    },
  });

  assert.equal(parsed.length, 3);
  assert.equal(parsed[0]?.id, "workspace-alpha");
});

test("getCurrentWorkspaceIdFromPathname detects workspace routes only", () => {
  assert.equal(getCurrentWorkspaceIdFromPathname("/dashboard"), null);
  assert.equal(getCurrentWorkspaceIdFromPathname("/w/workspace-alpha"), "workspace-alpha");
  assert.equal(
    getCurrentWorkspaceIdFromPathname("/w/workspace-alpha/documents"),
    "workspace-alpha",
  );
});

test("workspace switcher keyboard guards and roving-index helpers stay deterministic", () => {
  assert.equal(isWorkspaceMenuOpenKey("Enter"), true);
  assert.equal(isWorkspaceMenuOpenKey("ArrowDown"), true);
  assert.equal(isWorkspaceMenuOpenKey("Escape"), false);

  assert.equal(isWorkspaceMenuNavigationKey("ArrowDown"), true);
  assert.equal(isWorkspaceMenuNavigationKey("Home"), true);
  assert.equal(isWorkspaceMenuNavigationKey("Tab"), false);

  assert.equal(getWorkspaceMenuOpenIndex("ArrowUp", 1, 3), 2);
  assert.equal(getWorkspaceMenuOpenIndex("Enter", 1, 3), 1);
  assert.equal(getWorkspaceMenuOpenIndex("Enter", -1, 3), 0);

  assert.equal(getWorkspaceMenuNextIndex(0, "ArrowDown", 3), 1);
  assert.equal(getWorkspaceMenuNextIndex(0, "ArrowUp", 3), 2);
  assert.equal(getWorkspaceMenuNextIndex(1, "Home", 3), 0);
  assert.equal(getWorkspaceMenuNextIndex(1, "End", 3), 2);
});

test("getWorkspaceTriggerCopy reflects global and current-workspace states", () => {
  const globalCopy = getWorkspaceTriggerCopy(
    {
      kind: "loaded",
      workspaces: workspaceFixtures,
    },
    null,
  );
  const currentCopy = getWorkspaceTriggerCopy(
    {
      kind: "loaded",
      workspaces: workspaceFixtures,
    },
    "workspace-alpha",
  );

  assert.equal(globalCopy.label, "Select Workspace");
  assert.equal(globalCopy.meta, "3 member workspaces");
  assert.equal(currentCopy.label, "Alpha Launch");
  assert.match(currentCopy.meta, /Current workspace/);
});

test("workspace switcher renders the loaded global-route state with a create action", () => {
  const markup = renderToStaticMarkup(
    <WorkspaceSwitcherMenu
      initialOpen
      currentWorkspaceId={null}
      dataState={{
        kind: "loaded",
        workspaces: workspaceFixtures,
      }}
    />,
  );

  assert.match(markup, /Select Workspace/);
  assert.match(markup, /Alpha Launch/);
  assert.match(markup, /Create workspace/);
  assert.doesNotMatch(markup, /Current<\/span>/);
});

test("workspace switcher highlights the current workspace on workspace routes", () => {
  const markup = renderToStaticMarkup(
    <WorkspaceSwitcherMenu
      initialOpen
      currentWorkspaceId="workspace-alpha"
      dataState={{
        kind: "loaded",
        workspaces: workspaceFixtures,
      }}
    />,
  );

  assert.match(markup, /Alpha Launch/);
  assert.match(markup, /Current workspace · Tech Lead/);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, />Current</);
});

test("workspace switcher renders empty and error states truthfully", () => {
  const emptyMarkup = renderToStaticMarkup(
    <WorkspaceSwitcherMenu initialOpen currentWorkspaceId={null} dataState={{ kind: "empty" }} />,
  );
  const errorMarkup = renderToStaticMarkup(
    <WorkspaceSwitcherMenu
      initialOpen
      currentWorkspaceId={null}
      dataState={{
        kind: "error",
        message:
          "The workspace list endpoint is not available in this environment yet.",
        requestId: "req_workspace_switcher",
      }}
    />,
  );

  assert.match(emptyMarkup, /No workspaces yet/);
  assert.match(emptyMarkup, /Create workspace/);
  assert.match(errorMarkup, /Workspace list unavailable/);
  assert.match(errorMarkup, /Retry workspace list/);
  assert.match(errorMarkup, /req_workspace_switcher/);
});
