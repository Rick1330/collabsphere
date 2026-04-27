import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

const isInternalHref = (href: string) => href.startsWith("/") && !href.startsWith("//");

interface AuthStatusCardProps {
  variant: "loading" | "success" | "error" | "expired";
  heading: string;
  description: string | React.ReactNode;
  action?: { label: string; href: string } | { label: string; onClick: () => void };
  secondaryAction?: { label: string; href: string };
  disableAnimations?: boolean;
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

/** Computes framer-motion animation props for the card icon and outer container.
 *  When `disabled` is true (or reduced motion is preferred) all motion is zeroed out. */
const useCardAnimations = (
  variant: AuthStatusCardProps["variant"],
  reduced: boolean | null,
  disabled: boolean,
) => {
  const skip = disabled || !!reduced;

  const iconMotion = skip
    ? {}
    : variant === "success"
      ? {
          initial: { scale: 0, rotate: -90 },
          animate: { scale: 1, rotate: 0 },
          transition: { type: "spring" as const, stiffness: 400, damping: 15, delay: 0.15 },
        }
      : variant !== "loading"
        ? {
            initial: { scale: 0.8, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: { type: "spring" as const, stiffness: 300, damping: 20 },
          }
        : {};

  const containerAnimation = skip
    ? {}
    : { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring" as const, stiffness: 300, damping: 20 } };

  return { iconMotion, containerAnimation };
};

const actionBtnClass =
  "cs-focus cs-btn-primary shine-effect w-full h-11 rounded-lg text-sm font-semibold mt-6 flex items-center justify-center";

/** Renders either a <button>, internal <Link>, or external <a> depending on action shape. */
const CardAction = ({ action }: { action: NonNullable<AuthStatusCardProps["action"]> }) => {
  if ("onClick" in action) {
    return (
      <button type="button" onClick={action.onClick} className={actionBtnClass}>
        {action.label}
      </button>
    );
  }
  if (isInternalHref(action.href)) {
    return (
      <Link to={action.href} className={actionBtnClass}>
        {action.label}
      </Link>
    );
  }
  return (
    <a href={action.href} className={actionBtnClass}>
      {action.label}
    </a>
  );
};

const secondaryLinkStyle = { color: "rgba(45,212,191,0.7)" };
const secondaryLinkClass = "block mt-3 text-sm font-medium transition-colors duration-150";

/** Renders a secondary action link (href only — onClick not supported for secondary). */
const CardSecondaryAction = ({ action }: { action: NonNullable<AuthStatusCardProps["secondaryAction"]> }) => {
  const handleEnter = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = "#2DD4BF"; };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = "rgba(45,212,191,0.7)"; };

  if (isInternalHref(action.href)) {
    return (
      <Link
        to={action.href}
        className={secondaryLinkClass}
        style={secondaryLinkStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {action.label}
      </Link>
    );
  }
  return (
    <a
      href={action.href}
      className={secondaryLinkClass}
      style={secondaryLinkStyle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {action.label}
    </a>
  );
};

export const AuthStatusCard = ({
  variant,
  heading,
  description,
  action,
  secondaryAction,
  disableAnimations = false,
}: AuthStatusCardProps) => {
  const reduced = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const cfg = iconConfig[variant];
  const { iconMotion, containerAnimation } = useCardAnimations(variant, reduced, disableAnimations);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (variant !== "loading") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [variant]);

  const role = variant === "loading" || variant === "success" ? "status" : "alert";

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

      {action && <CardAction action={action} />}

      {secondaryAction && <CardSecondaryAction action={secondaryAction} />}
    </div>
  );
};
