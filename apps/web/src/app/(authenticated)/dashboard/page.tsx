import React from "react";
import { RoutePlaceholder } from "../../../components/shared/route-placeholder";

export default function DashboardPage() {
  return (
    <>
      <section className="status-grid" aria-label="Dashboard foundation status">
        <article className="status-pill">
          <strong>Route foundation</strong>
          <span>Live at /dashboard</span>
        </article>
        <article className="status-pill">
          <strong>Data state</strong>
          <span>Deferred to downstream API/query stories</span>
        </article>
        <article className="status-pill">
          <strong>Shell behavior</strong>
          <span>Deferred to theme/nav stories</span>
        </article>
      </section>
      <RoutePlaceholder
        title="Dashboard route"
        summary="The authenticated global home route is now part of the real frontend runtime, but still intentionally stops short of product-complete widgets."
        emptyState="Dashboard empty-state handling is now called out explicitly so later data modules can render no-workspace and no-activity variants in-place."
        implementedNow={[
          "Authenticated route group layout",
          "Dashboard route segment and server component page",
          "Explicit separation between platform foundation and story delivery",
        ]}
        deferredWork={[
          "Story #31 top navigation shell behavior",
          "Story #32 sidebar and workspace switcher behavior",
          "Real dashboard data modules and empty/error variants",
        ]}
      />
    </>
  );
}
