import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Monitor, Moon, Sun } from "lucide-react";
import { useThemePreference } from "@/hooks/use-theme-preference";

interface AuthLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthLayout = ({ children, footer }: AuthLayoutProps) => {
  const reduced = useReducedMotion();
  const { preference, resolvedTheme, setPreference } = useThemePreference();

  const isDark = resolvedTheme === "dark";
  const cardBg = isDark ? "rgba(10,26,26,0.8)" : "rgba(255,255,255,0.92)";
  const cardBorder = isDark ? "1px solid rgba(20,184,166,0.15)" : "1px solid rgba(13,148,136,0.18)";
  const cardShadow = isDark
    ? "0 0 80px rgba(20,184,166,0.03)"
    : "0 24px 60px -20px rgba(13,148,136,0.18), 0 1px 3px rgba(28,25,23,0.06)";
  const dotFill = isDark ? "rgba(20,184,166,0.03)" : "rgba(13,148,136,0.06)";
  const ambient = isDark
    ? "radial-gradient(ellipse 800px 600px at 50% 40%, rgba(20,184,166,0.04), transparent 70%)"
    : "radial-gradient(ellipse 900px 700px at 50% 30%, rgba(13,148,136,0.08), transparent 70%)";
  const fade = "var(--cs-base)";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "var(--cs-base)" }}>
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="auth-dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="0.75" fill={dotFill} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-dot-grid)" />
        </svg>
        {/* Ambient glow */}
        <div className="absolute inset-0" style={{ background: ambient }} />
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-40" style={{ background: `linear-gradient(to bottom, ${fade}, transparent)` }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: `linear-gradient(to top, ${fade}, transparent)` }} />
      </div>

      {/* Theme toggle — top-right */}
      <div
        className="absolute top-4 right-4 z-20 flex items-center gap-0.5 rounded-full p-0.5 backdrop-blur-md"
        style={{
          background: isDark ? "rgba(10,26,26,0.6)" : "rgba(255,255,255,0.7)",
          border: isDark ? "1px solid rgba(20,184,166,0.18)" : "1px solid rgba(13,148,136,0.18)",
        }}
        role="group"
        aria-label="Theme"
      >
        {(
          [
            { v: "light", icon: Sun, label: "Light" },
            { v: "system", icon: Monitor, label: "System" },
            { v: "dark", icon: Moon, label: "Dark" },
          ] as const
        ).map(({ v, icon: Icon, label }) => {
          const active = preference === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setPreference(v)}
              aria-pressed={active}
              aria-label={`${label} theme`}
              title={label}
              className="h-7 w-7 rounded-full inline-flex items-center justify-center transition-colors duration-150"
              style={{
                background: active
                  ? isDark
                    ? "rgba(45,212,191,0.18)"
                    : "rgba(13,148,136,0.14)"
                  : "transparent",
                color: active
                  ? isDark
                    ? "#5EEAD4"
                    : "#0F766E"
                  : "var(--cs-text-muted)",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Link to="/" className="text-lg font-bold tracking-tight transition-colors duration-150 hover:text-cs-teal-primary" style={{ color: "var(--cs-text-headline)" }}>
          CollabSphere
        </Link>
      </div>

      {/* Auth card */}
      <motion.div
        className="relative z-10 w-full max-w-[420px] mx-auto px-4"
        initial={reduced ? false : { opacity: 0, filter: "blur(6px)", y: 12 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="rounded-xl p-8 backdrop-blur-xl" style={{
          background: cardBg,
          border: cardBorder,
          boxShadow: cardShadow,
        }}>
          {children}
        </div>
      </motion.div>

      {/* Footer */}
      {footer && (
        <div className="relative z-10 mt-6 text-sm text-center">
          {footer}
        </div>
      )}

    </div>
  );
};
