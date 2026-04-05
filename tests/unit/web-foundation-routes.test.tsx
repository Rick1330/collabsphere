import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import DashboardPage from "../../apps/web/src/app/(authenticated)/dashboard/page";
import LandingPage from "../../apps/web/src/app/(public)/page";
import { RoutePlaceholder } from "../../apps/web/src/components/foundation/route-placeholder";

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

test("RoutePlaceholder renders shared foundation sections without optional children", () => {
  const markup = renderToStaticMarkup(
    <RoutePlaceholder
      title="Example route"
      summary="Shared route summary"
      emptyState="Empty placeholder"
      implementedNow={["Route shell", "Segment loading state"]}
      deferredWork={["Real data", "Navigation polish"]}
    />,
  );

  assert.match(markup, /Foundation route/i);
  assert.match(markup, /Example route/i);
  assert.match(markup, /Shared route summary/i);
  assert.match(markup, /Empty-state foundation/i);
  assert.match(markup, /Empty placeholder/i);
  assert.match(markup, /Route shell/i);
  assert.match(markup, /Segment loading state/i);
  assert.match(markup, /Real data/i);
  assert.match(markup, /Navigation polish/i);
});

test("RoutePlaceholder renders optional children alongside implemented and deferred lists", () => {
  const markup = renderToStaticMarkup(
    <RoutePlaceholder
      title="Child route"
      summary="Child summary"
      emptyState="Child empty state"
      implementedNow={[]}
      deferredWork={[]}
    >
      <div>Nested child content</div>
    </RoutePlaceholder>,
  );

  assert.match(markup, /Child route/i);
  assert.match(markup, /Nested child content/i);
  assert.match(markup, /Implemented now/i);
  assert.match(markup, /Deferred downstream work/i);
});
