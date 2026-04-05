import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import DashboardPage from "../../apps/web/src/app/(authenticated)/dashboard/page";
import LandingPage from "../../apps/web/src/app/(public)/page";

test("LandingPage renders the PRJ-02 platform transition message", () => {
  const markup = renderToStaticMarkup(<LandingPage />);

  assert.match(markup, /Next\.js App Router is now the real frontend foundation/i);
  assert.match(markup, /Continue to login/i);
  assert.match(markup, /Public route group/i);
});

test("DashboardPage renders the authenticated foundation status placeholders", () => {
  const markup = renderToStaticMarkup(<DashboardPage />);

  assert.match(markup, /Authenticated global home route/i);
  assert.match(markup, /Route foundation/i);
  assert.match(markup, /Story #31 top navigation shell behavior/i);
});
