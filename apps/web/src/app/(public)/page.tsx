import React from "react";
import Link from "next/link";

import { RoutePlaceholder } from "../../components/shared/route-placeholder";

export default function LandingPage() {
  return (
    <>
      <section className="hero-grid">
        <article className="hero-card">
          <p className="shell__eyebrow">PRJ-02 platform transition</p>
          <h2>Next.js App Router is now the real frontend foundation.</h2>
          <p>
            This route replaces the former static HTML placeholder. It
            establishes the public entry surface, shared root layout, route
            groups, and baseline accessibility contract for downstream feature
            work.
          </p>
          <div className="hero-actions">
            <Link className="hero-button hero-button--primary" href="/login">
              Continue to login
            </Link>
            <Link className="hero-button hero-button--secondary" href="/dashboard">
              Inspect authenticated shell
            </Link>
          </div>
        </article>
        <aside className="hero-panel">
          <h2>Contexts wired in this baton</h2>
          <ol className="path-list">
            <li>
              <code>/</code>, <code>/login</code>, <code>/register</code>
            </li>
            <li>
              <code>/dashboard</code>, <code>/workspaces</code>,{" "}
              <code>/settings</code>, <code>/settings/profile</code>
            </li>
            <li>
              <code>/w/[workspaceId]</code>, <code>/w/[workspaceId]/documents</code>,{" "}
              <code>/w/[workspaceId]/tasks</code>
            </li>
            <li>
              <code>/admin</code>
            </li>
          </ol>
        </aside>
      </section>
      <RoutePlaceholder
        title="Public route group"
        summary="The public entry surface now has a persistent layout, route loading/not-found/error handling, and truthful room for auth and marketing stories."
        emptyState="Public routes now reserve a stable empty-state presentation area for later marketing and auth-driven variants."
        implementedNow={[
          "Root App Router layout and global CSS",
          "Public route grouping for unauthenticated pages",
          "Accessible skip link and mobile-safe shell behavior",
        ]}
        deferredWork={[
          "Story #29 landing-page content and conversion design",
          "Full login/register forms, OAuth, and auth-state redirects",
          "Forgot-password, verify-email, and invite flows",
        ]}
      />
    </>
  );
}
