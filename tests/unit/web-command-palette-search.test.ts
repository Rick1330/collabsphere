import assert from "node:assert/strict";
import test from "node:test";

import { buildSearchUrl, normalizeSearchQuery } from "../../apps/web/src/lib/api/search";
import {
  buildCommandPaletteGroups,
  getSearchScopeFromPathname,
  normalizeCommandPaletteQuery,
  stripSearchSnippetMarkup,
} from "../../apps/web/src/components/shell/command-palette-search-helpers";

const workspaceScopedLoadedStatus = {
  kind: "loaded" as const,
  query: "lo",
  results: {
    documents: [
      {
        id: "doc-1",
        title: "Doc 1",
        snippet: "a hit",
        updatedAt: "2025-07-17T12:10:00Z",
        url: "/w/workspace-alpha/documents/doc-1",
      },
    ],
    tasks: [
      {
        id: "task-1",
        title: "Task 1",
        snippet: "b hit",
        status: "open",
        priority: "low",
        dueDate: null,
        url: "/w/workspace-alpha/tasks/task-1",
      },
    ],
  },
};

test("normalizeSearchQuery trims and caps at 200 chars", () => {
  assert.equal(normalizeSearchQuery("  hi  "), "hi");
  assert.equal(normalizeSearchQuery("a".repeat(250)).length, 200);
});

test("getSearchScopeFromPathname chooses workspace scope when on /w/:workspaceId routes", () => {
  assert.deepEqual(getSearchScopeFromPathname(null), { scope: "global", workspaceId: null });
  assert.deepEqual(getSearchScopeFromPathname("/dashboard"), { scope: "global", workspaceId: null });
  assert.deepEqual(getSearchScopeFromPathname("/w/workspace-alpha/tasks"), {
    scope: "workspace",
    workspaceId: "workspace-alpha",
  });
});

test("buildSearchUrl includes expected query params", () => {
  const url = buildSearchUrl({
    q: "login page",
    scope: "workspace",
    workspaceId: "workspace-alpha",
    types: ["documents", "tasks"],
    page: 1,
    pageSize: 25,
  });

  assert.match(url, /^\/api\/v1\/search\?/);
  assert.match(url, /q=login\+page/);
  assert.match(url, /scope=workspace/);
  assert.match(url, /workspaceId=workspace-alpha/);
  assert.match(url, /types=documents%2Ctasks/);
  assert.match(url, /page=1/);
  assert.match(url, /pageSize=25/);
});

test("stripSearchSnippetMarkup removes mark tags safely", () => {
  assert.equal(stripSearchSnippetMarkup("hello <mark>world</mark>"), "hello world");
});

test("buildCommandPaletteGroups keeps baseline groups when query length < 2", () => {
  const groups = buildCommandPaletteGroups({
    baseGroups: [{ id: "recent", label: "Recent", items: [] }],
    normalizedQuery: normalizeCommandPaletteQuery("a"),
    status: { kind: "idle" },
    onSelectUrl: () => {},
  });

  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.id, "recent");
});

test("buildCommandPaletteGroups adds loading placeholders when query length >= 2", () => {
  const groups = buildCommandPaletteGroups({
    baseGroups: [{ id: "recent", label: "Recent", items: [] }],
    normalizedQuery: "lo",
    status: { kind: "loading", query: "lo" },
    onSelectUrl: () => {},
  });

  assert.equal(groups.length, 3);
  assert.equal(groups[1]?.label, "Documents");
  assert.equal(groups[1]?.items[0]?.disabled, true);
  assert.equal(groups[2]?.label, "Tasks");
});

test("buildCommandPaletteGroups caps results to 5 per group and strips snippet markup", () => {
  const documents = Array.from({ length: 7 }).map((_, index) => ({
    id: `doc-${index}`,
    title: `Doc ${index}`,
    snippet: `a <mark>hit</mark> ${index}`,
    updatedAt: "2025-07-17T12:10:00Z",
    url: `/w/workspace-alpha/documents/doc-${index}`,
  }));

  const tasks = Array.from({ length: 6 }).map((_, index) => ({
    id: `task-${index}`,
    title: `Task ${index}`,
    snippet: `b <mark>hit</mark> ${index}`,
    status: "in_progress",
    priority: "high",
    dueDate: null,
    url: `/w/workspace-alpha/tasks/task-${index}`,
  }));

  const groups = buildCommandPaletteGroups({
    baseGroups: [{ id: "recent", label: "Recent", items: [] }],
    normalizedQuery: "login",
    status: { kind: "loaded", query: "login", results: { documents, tasks } },
    onSelectUrl: () => {},
  });

  const documentsGroup = groups.find((group) => group.id === "search-documents");
  const tasksGroup = groups.find((group) => group.id === "search-tasks");

  assert.equal(documentsGroup?.items.length, 5);
  assert.equal(tasksGroup?.items.length, 5);
  assert.equal(documentsGroup?.items[0]?.description?.includes("<mark>"), false);
});

test("buildCommandPaletteGroups annotates search results with icons and workspace pills when scoped", () => {
  const groups = buildCommandPaletteGroups({
    baseGroups: [],
    normalizedQuery: "lo",
    scope: "workspace",
    status: workspaceScopedLoadedStatus,
    onSelectUrl: () => {},
  });

  const documentsGroup = groups.find((group) => group.id === "search-documents");
  const tasksGroup = groups.find((group) => group.id === "search-tasks");

  assert.ok(documentsGroup);
  assert.ok(tasksGroup);
  assert.equal(documentsGroup.items[0].icon, "📄");
  assert.equal(documentsGroup.items[0].pill, "Workspace");
  assert.equal(tasksGroup.items[0].icon, "✅");
  assert.equal(tasksGroup.items[0].pill, "Workspace");
});

test("buildCommandPaletteGroups shows empty state when both result groups are empty", () => {
  const groups = buildCommandPaletteGroups({
    baseGroups: [{ id: "recent", label: "Recent", items: [] }],
    normalizedQuery: "login",
    status: { kind: "loaded", query: "login", results: { documents: [], tasks: [] } },
    onSelectUrl: () => {},
  });

  const emptyGroup = groups.find((group) => group.id === "search-empty");
  assert.equal(emptyGroup?.items[0]?.disabled, true);
});

test("buildCommandPaletteGroups shows a safe error message without query leakage", () => {
  const groups = buildCommandPaletteGroups({
    baseGroups: [{ id: "recent", label: "Recent", items: [] }],
    normalizedQuery: "login",
    status: { kind: "error", query: "login", message: "Search could not be completed.", requestId: null },
    onSelectUrl: () => {},
  });

  const errorGroup = groups.find((group) => group.id === "search-error");
  assert.equal(errorGroup?.items[0]?.disabled, true);
  assert.equal(errorGroup?.items[0]?.label.includes("login"), false);
});

