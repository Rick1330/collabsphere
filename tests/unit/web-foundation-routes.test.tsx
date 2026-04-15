import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";
import { middleware } from "../../apps/web/src/middleware";
import {
  buildProtectedRouteRedirectUrl,
  getProtectedRouteScope,
} from "../../apps/web/src/lib/protected-route-boundary";

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
