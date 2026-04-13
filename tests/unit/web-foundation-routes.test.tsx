import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";

import DashboardPage from "../../apps/web/src/app/(authenticated)/dashboard/page";
import LandingPage from "../../apps/web/src/app/(public)/page";
import { middleware } from "../../apps/web/src/middleware";
import { RoutePlaceholder } from "../../apps/web/src/components/shared/route-placeholder";
import {
  buildProtectedRouteRedirectUrl,
  getProtectedRouteScope,
} from "../../apps/web/src/lib/protected-route-boundary";

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

test("protected route scope classifies public and non-public namespaces truthfully", () => {
  assert.equal(getProtectedRouteScope("/"), null);
  assert.equal(getProtectedRouteScope("/login"), null);
  assert.equal(getProtectedRouteScope("/dashboard"), "authenticated");
  assert.equal(getProtectedRouteScope("/settings/profile"), "authenticated");
  assert.equal(getProtectedRouteScope("/w/acme/tasks"), "workspace");
  assert.equal(getProtectedRouteScope("/admin"), "admin");
  assert.equal(getProtectedRouteScope("/admin/users"), "admin");
});

test("protected route redirect preserves destination and scope for login handoff", () => {
  const redirectUrl = buildProtectedRouteRedirectUrl(
    new URL("https://collabsphere.test/w/acme/tasks?view=board"),
    "workspace",
  );

  assert.equal(
    redirectUrl.toString(),
    "https://collabsphere.test/login?next=%2Fw%2Facme%2Ftasks%3Fview%3Dboard&reason=workspace",
  );
});

test("middleware redirects protected namespaces before protected UI renders", () => {
  const authenticatedResponse = middleware(
    new NextRequest("https://collabsphere.test/dashboard"),
  );
  const workspaceResponse = middleware(
    new NextRequest("https://collabsphere.test/w/acme/documents"),
  );
  const adminResponse = middleware(new NextRequest("https://collabsphere.test/admin"));
  const publicResponse = middleware(new NextRequest("https://collabsphere.test/login"));

  assert.equal(authenticatedResponse.status, 307);
  assert.equal(
    authenticatedResponse.headers.get("location"),
    "https://collabsphere.test/login?next=%2Fdashboard&reason=authenticated",
  );
  assert.equal(workspaceResponse.status, 307);
  assert.equal(
    workspaceResponse.headers.get("location"),
    "https://collabsphere.test/login?next=%2Fw%2Facme%2Fdocuments&reason=workspace",
  );
  assert.equal(adminResponse.status, 307);
  assert.equal(
    adminResponse.headers.get("location"),
    "https://collabsphere.test/login?next=%2Fadmin&reason=admin",
  );
  assert.equal(publicResponse.headers.get("location"), null);
});
