import { ArrowRight } from "lucide-react";
import { MagneticButton } from "./magnetic-button";

// Footer link map.
//   - `href` makes the row a real, clickable link.
//   - `soon` marks the row as a non-interactive "coming soon" placeholder
//     so we don't ship dead links while those surfaces are still being built.
//   - `external` opens in a new tab (used for the GitHub repo).
const GITHUB_URL = "https://github.com/Rick1330/collabsphere";

const footerLinks: {
  title: string;
  links: { label: string; href?: string; soon?: boolean; external?: boolean }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", soon: true },
      { label: "Templates", soon: true },
      { label: "Changelog", soon: true },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", soon: true },
      { label: "API Reference", soon: true },
      { label: "Status", soon: true },
      { label: "GitHub", href: GITHUB_URL, external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", soon: true },
      { label: "Blog", soon: true },
      { label: "Careers", soon: true },
      { label: "Contact", soon: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", soon: true },
      { label: "Terms of Service", soon: true },
      { label: "Security", soon: true },
    ],
  },
];

export const CtaFooter = () => (
  <>
    <section className="py-32 lg:py-40 text-center relative overflow-hidden">
      <div className="absolute -inset-40 -z-10 opacity-50 hidden sm:block animate-cs-spin-slow" style={{
        background: "conic-gradient(from 0deg at 50% 50%, rgba(20,184,166,0.06), rgba(15,23,42,0), rgba(20,184,166,0.04), rgba(15,23,42,0))",
        filter: "blur(80px)",
      }} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <h2 className="cs-headline text-3xl sm:text-4xl lg:text-5xl max-w-3xl mx-auto text-balance">
          Stop paying for five tools that don't talk to each other
        </h2>
        <p className="text-lg mt-6 max-w-xl mx-auto" style={{ color: "var(--cs-text-body)" }}>
          CollabSphere replaces your docs tool, your task tracker, and your project wiki. One workspace. One source of truth. Free to start.
        </p>
        <div className="mt-10">
          <MagneticButton href="#" size="large">
            Get started free <ArrowRight className="h-5 w-5 ml-2" />
          </MagneticButton>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--cs-text-muted)" }}>
          Already have an account?{" "}
          <a href="#" className="cs-focus underline decoration-cs-teal-primary/40 hover:decoration-cs-teal-primary transition-colors" style={{ color: "var(--cs-teal-primary)" }}>Sign in</a>
        </p>
      </div>
    </section>

    <footer className="border-t max-w-7xl mx-auto px-6" style={{ borderColor: "rgba(20,184,166,0.1)" }}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8">
        {footerLinks.map(col => (
          <div key={col.title}>
            <h4 className="font-mono-cs text-[10px] tracking-[0.15em] uppercase mb-4" style={{ color: "var(--cs-text-faint)" }}>{col.title}</h4>
            <ul className="space-y-1">
              {col.links.map(link => (
                <li key={link.label}>
                  {link.soon ? (
                    <span
                      className="text-sm py-1 inline-flex items-center gap-1.5 cursor-default select-none"
                      style={{ color: "var(--cs-text-faint)" }}
                      aria-disabled="true"
                      title="Coming soon"
                    >
                      {link.label}
                      <span
                        className="font-mono-cs text-[9px] tracking-[0.12em] uppercase px-1.5 py-0.5 rounded border"
                        style={{
                          color: "var(--cs-teal-primary)",
                          borderColor: "var(--cs-teal-faint)",
                          backgroundColor: "color-mix(in srgb, var(--cs-teal-primary) 8%, transparent)",
                        }}
                      >
                        Soon
                      </span>
                    </span>
                  ) : link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="cs-focus text-sm py-1 block transition-colors hover:text-cs-teal-primary"
                      style={{ color: "var(--cs-text-muted)" }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className="cs-focus text-sm py-1 block transition-colors hover:text-cs-teal-primary"
                      style={{ color: "var(--cs-text-muted)" }}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t" style={{ borderColor: "rgba(20,184,166,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cs-emerald animate-pulse" />
          <span className="font-mono-cs text-[11px] tracking-wider" style={{ color: "var(--cs-text-faint)" }}>ALL SYSTEMS OPERATIONAL</span>
        </div>
        <span className="font-mono-cs text-[11px] tracking-wider" style={{ color: "var(--cs-text-faint)" }}>© 2026 COLLABSPHERE</span>
      </div>
    </footer>
  </>
);
