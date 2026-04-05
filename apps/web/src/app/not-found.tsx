import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="error-screen">
      <section className="error-card">
        <p className="shell__eyebrow">Route not found</p>
        <h1>The requested route is outside the current foundation map.</h1>
        <p>
          The App Router foundation is live, but only the initial public,
          authenticated, workspace, and admin contexts are wired in this baton.
        </p>
        <Link className="hero-button hero-button--primary" href="/">
          Return to landing
        </Link>
      </section>
    </main>
  );
}
