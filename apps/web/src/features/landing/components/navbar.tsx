import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./theme-toggle";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "color-mix(in srgb, var(--cs-surface) 82%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--cs-teal-faint)"
          : "1px solid transparent",
      }}
    >
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-tight transition-colors duration-150 hover:text-cs-teal-primary" style={{ color: "var(--cs-text-headline)" }}>
          CollabSphere
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <Link to="/login" className="cs-focus text-sm font-medium transition-colors duration-150 hover:text-[var(--cs-text-headline)]" style={{ color: "var(--cs-text-muted)" }}>
            Log in
          </Link>
          <Link to="/register" className="cs-focus cs-btn-primary shine-effect px-5 h-9 inline-flex items-center text-sm">
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
};
