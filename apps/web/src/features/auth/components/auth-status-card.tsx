import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

const isInternalHref = (href: string) => href.startsWith("/") && !href.startsWith("//");

interface AuthStatusCardProps {
  variant: "loading" | "success" | "error" | "expired";
  heading: string;
  description: string | React.ReactNode;
  action?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
}

const iconConfig = {
  loading: { bg: "rgba(20,184,166,0.06)", border: "rgba(20,184,166,0.1)", Icon: Loader2, color: "var(--cs-teal-primary)" },
  success: { bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.1)", Icon: CheckCircle2, color: "#34d399" },
  error: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.1)", Icon: XCircle, color: "#f87171" },
  expired: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.1)", Icon: Clock, color: "#fbbf24" },
};

const CustomSpinner = () => (
  <div className="relative h-7 w-7">
    <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(20,184,166,0.2)", borderTopColor: "var(--cs-teal-primary)", animationDuration: "1.5s" }} />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--cs-teal-primary)" }} />
    </div>
  </div>
);

export const AuthStatusCard = ({ variant, heading, description, action, secondaryAction }: AuthStatusCardProps) => {
  const reduced = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const cfg = iconConfig[variant];

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (variant !== "loading") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [variant]);

  const role = variant === "loading" || variant === "success" ? "status" : "alert";
  const iconMotion =
    variant === "success" && !reduced
      ? {
          initial: { scale: 0, rotate: -90 },
          animate: { scale: 1, rotate: 0 },
          transition: { type: "spring" as const, stiffness: 400, damping: 15, delay: 0.15 },
        }
      : variant !== "loading" && !reduced
        ? {
            initial: { scale: 0.8, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: { type: "spring" as const, stiffness: 300, damping: 20 },
          }
        : {};

  const containerAnimation = !reduced
    ? { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring" as const, stiffness: 300, damping: 20 } }
    : {};

  return (
    <div className="text-center" role={role}>
      <motion.div
        className="h-14 w-14 rounded-2xl mx-auto flex items-center justify-center"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        {...containerAnimation}
      >
        {variant === "loading" ? (
          <CustomSpinner />
        ) : (
          <motion.div {...iconMotion}>
            <cfg.Icon className="h-7 w-7" style={{ color: cfg.color }} />
          </motion.div>
        )}
      </motion.div>

      <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold tracking-tight mt-5 outline-none" style={{ color: "var(--cs-text-headline)" }}>
        {heading}
      </h2>

      <p className="text-sm leading-relaxed mt-2 max-w-[300px] mx-auto" style={{ color: "var(--cs-text-body)" }}>
        {description}
      </p>

      {variant === "loading" && (
        <p className="font-mono-cs text-[10px] tracking-wider mt-6" style={{ color: "var(--cs-text-faint)" }}>
          VALIDATING TOKEN · {elapsed}s
        </p>
      )}

      {action && (
        action.onClick ? (
          <button type="button" onClick={action.onClick} className="cs-focus cs-btn-primary shine-effect w-full h-11 rounded-lg text-sm font-semibold mt-6 flex items-center justify-center">
            {action.label}
          </button>
        ) : action.href && isInternalHref(action.href) ? (
          <Link to={action.href} className="cs-focus cs-btn-primary shine-effect w-full h-11 rounded-lg text-sm font-semibold mt-6 flex items-center justify-center">
            {action.label}
          </Link>
        ) : action.href ? (
          <a href={action.href} className="cs-focus cs-btn-primary shine-effect w-full h-11 rounded-lg text-sm font-semibold mt-6 flex items-center justify-center">
            {action.label}
          </a>
        ) : null
      )}

      {secondaryAction && (
        secondaryAction.onClick ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="block mt-3 text-sm font-medium transition-colors duration-150 mx-auto"
            style={{ color: "rgba(45,212,191,0.7)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#2DD4BF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(45,212,191,0.7)"; }}
          >
            {secondaryAction.label}
          </button>
        ) : secondaryAction.href && isInternalHref(secondaryAction.href) ? (
          <Link
            to={secondaryAction.href}
            className="block mt-3 text-sm font-medium transition-colors duration-150"
            style={{ color: "rgba(45,212,191,0.7)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#2DD4BF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(45,212,191,0.7)"; }}
          >
            {secondaryAction.label}
          </Link>
        ) : secondaryAction.href ? (
          <a
            href={secondaryAction.href}
            className="block mt-3 text-sm font-medium transition-colors duration-150"
            style={{ color: "rgba(45,212,191,0.7)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#2DD4BF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(45,212,191,0.7)"; }}
          >
            {secondaryAction.label}
          </a>
        ) : null
      )}
    </div>
  );
};
