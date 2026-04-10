import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  CommandPalette,
  isCommandPaletteCloseKey,
  type CommandPaletteGroup,
} from "../../apps/web/src/components/foundation/command-palette";
import { repoRoot } from "./bootstrap-test-helpers";

const globalsCss = fs.readFileSync(path.join(repoRoot, "apps/web/src/app/globals.css"), "utf8");

test("command palette close-key guard only allows Escape", () => {
  assert.equal(isCommandPaletteCloseKey("Escape"), true);
  assert.equal(isCommandPaletteCloseKey("Enter"), false);
});

test("command palette renders a dialog with autofocus input and grouped results", () => {
  const groups: CommandPaletteGroup[] = [
    {
      id: "recent",
      label: "Recent",
      items: [
        {
          id: "doc-intro",
          label: "Introduction",
          description: "Project Alpha",
        },
      ],
    },
    {
      id: "actions",
      label: "Actions",
      items: [
        {
          id: "create-workspace",
          label: "Create new workspace",
          description: "Navigate to /workspaces/new",
        },
      ],
    },
  ];

  const markup = renderToStaticMarkup(
    <CommandPalette
      groups={groups}
      isOpen
      onClose={() => {}}
      query=""
      onQueryChange={() => {}}
    />,
  );

  assert.match(markup, /<dialog/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /Command palette/);
  assert.match(markup, /Type a command or search\.\.\./);
  assert.match(markup, /placeholder="Type a command or search\.\.\."/);
  assert.match(markup, /autofocus=""/);
  assert.match(markup, /Close command palette/);
  assert.match(markup, /Recent/);
  assert.match(markup, /Introduction/);
  assert.match(markup, /Project Alpha/);
  assert.match(markup, /Actions/);
  assert.match(markup, /Create new workspace/);
});

test("command palette renders item icons and pills as aria-hidden decorations", () => {
  const markup = renderToStaticMarkup(
    <CommandPalette
      groups={[
        {
          id: "documents",
          label: "Documents",
          items: [
            {
              id: "doc-intro",
              icon: "📄",
              label: "Introduction",
              description: "Project Alpha",
              pill: "Workspace",
            },
          ],
        },
      ]}
      isOpen
      onClose={() => {}}
      query=""
      onQueryChange={() => {}}
    />,
  );

  assert.match(markup, /command-palette__item-icon/);
  assert.match(markup, /aria-hidden=\"true\">📄/);
  assert.match(markup, /command-palette__item-pill/);
  assert.match(markup, /aria-hidden=\"true\">Workspace/);
});

test("globals.css keeps the command palette full-width on mobile and width-capped on tablet+", () => {
  assert.match(globalsCss, /\.command-palette__dialog \{/);
  assert.match(globalsCss, /\.command-palette__panel \{/);
  assert.match(globalsCss, /width: min\(40rem, calc\(100vw - 2\.5rem\)\);/);
  assert.match(globalsCss, /@media \(width >= 768px\) and \(width <= 1279px\) \{/);
  assert.match(globalsCss, /width: min\(37\.5rem, calc\(100vw - 3rem\)\);/);
  assert.match(globalsCss, /@media \(width <= 767px\) \{/);
  assert.match(globalsCss, /width: 100vw;/);
  assert.match(globalsCss, /top: 0;/);
});
