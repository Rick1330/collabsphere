import { Navbar } from "@/features/landing/components/navbar";
import { Hero } from "@/features/landing/components/hero";
import { Features } from "@/features/landing/components/features";
import { WorkspaceDemo } from "@/features/landing/components/workspace-demo";
import { Audiences } from "@/features/landing/components/audiences";
import { CtaFooter } from "@/features/landing/components/cta-footer";

/**
 * Marketing landing page.
 *
 * Follows the global theme (system preference by default, or whatever
 * the user manually picked in Settings → Appearance). The CollabSphere
 * `--cs-*` tokens defined in `src/index.css` already ship with light and
 * dark variants, so no page-level theme overrides are needed here.
 */
const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--cs-base)" }}>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Features />
        <WorkspaceDemo />
        <Audiences />
        <CtaFooter />
      </main>
    </div>
  );
};

export default Index;
