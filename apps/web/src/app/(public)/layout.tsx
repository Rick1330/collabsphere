import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div
      data-theme="dark"
      className="relative min-h-screen overflow-hidden bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.26),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(13,148,136,0.18),transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(19,78,74,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(19,78,74,0.14)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-[var(--color-border)]/70 bg-[rgba(5,14,14,0.72)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-full text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgba(12,25,24,0.9)] text-base tracking-normal text-[var(--color-accent)]">
                CS
              </span>
              CollabSphere
            </Link>
            <nav aria-label="Public navigation" className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-[var(--color-border)] bg-[rgba(12,25,24,0.9)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
              >
                Create account
              </Link>
            </nav>
          </div>
        </header>
        <main id="main-content" className="relative z-10 flex-1">
          {children}
        </main>
        <footer className="border-t border-[var(--color-border)]/70 bg-[rgba(5,14,14,0.84)]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-[var(--color-text-secondary)] lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <p>One focused surface for workspaces, documents, tasks, and collaboration.</p>
            <div className="flex items-center gap-4">
              <Link
                href="/register"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)]"
              >
                Start free
              </Link>
              <Link
                href="/login"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)]"
              >
                Continue to sign in
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
