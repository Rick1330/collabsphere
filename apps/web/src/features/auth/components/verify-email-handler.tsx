import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";
import { AuthStatusCard } from "./auth-status-card";

type VerifyState =
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "already-verified" }
  | { kind: "expired" }
  | { kind: "invalid" };

type ResendState = "idle" | "loading" | "success" | "error";

interface VerifyEmailHandlerProps {
  token: string;
}

export const VerifyEmailHandler = ({ token }: VerifyEmailHandlerProps) => {
  const [state, setState] = useState<VerifyState>({ kind: "loading" });
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resendCooldown, setResendCooldown] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (response.ok) {
          setState({ kind: "success" });
          return;
        }
        const body = await response.json().catch(() => ({}));
        const code = body?.error?.code;
        if (code === "TOKEN_EXPIRED") {
          setState({ kind: "expired" });
        } else if (code === "TOKEN_ALREADY_USED") {
          setState({ kind: "already-verified" });
        } else {
          setState({ kind: "invalid" });
        }
      } catch {
        setState({ kind: "invalid" });
      }
    };
    verify();
  }, [token]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setResendState("idle");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    setResendState("loading");
    try {
      await fetch("/api/v1/auth/verify-email/resend-by-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setResendState("success");
      setResendCooldown(60);
    } catch {
      setResendState("error");
    }
  };

  const transition = { duration: 0.25 };
  const motionProps = {
    initial: reduced ? false : { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition,
  };

  return (
    <AnimatePresence mode="wait">
      {state.kind === "loading" && (
        <motion.div key="loading" {...motionProps}>
          <AuthStatusCard
            variant="loading"
            heading="Verifying your email"
            description="Please wait while we confirm your email address."
          />
        </motion.div>
      )}

      {state.kind === "success" && (
        <motion.div key="success" {...motionProps}>
          <AuthStatusCard
            variant="success"
            heading="Email verified"
            description="Your email address has been confirmed. You can now sign in to CollabSphere and start collaborating."
            action={{ label: "Continue to sign in", href: "/login" }}
          />
        </motion.div>
      )}

      {state.kind === "already-verified" && (
        <motion.div key="already-verified" {...motionProps}>
          <AuthStatusCard
            variant="success"
            heading="Already verified"
            description="Your email address was already confirmed. You can sign in to your account."
            action={{ label: "Sign in", href: "/login" }}
          />
        </motion.div>
      )}

      {state.kind === "expired" && (
        <motion.div key="expired" {...motionProps}>
          <ExpiredState
            resendState={resendState}
            resendCooldown={resendCooldown}
            onResend={handleResend}
            reduced={reduced}
          />
        </motion.div>
      )}

      {state.kind === "invalid" && (
        <motion.div key="invalid" {...motionProps}>
          <AuthStatusCard
            variant="error"
            heading="Invalid link"
            description="This verification link is not valid. It may have been copied incorrectly. Try signing in — if your email needs verification, you can request a new link from the login page."
            action={{ label: "Go to sign in", href: "/login" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ── Expired state with resend logic ── */

interface ExpiredStateProps {
  resendState: ResendState;
  resendCooldown: number;
  onResend: () => void;
  reduced: boolean | null;
}

const ExpiredState = ({ resendState, resendCooldown, onResend, reduced }: ExpiredStateProps) => {
  const iconAnimation = !reduced
    ? { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring" as const, stiffness: 300, damping: 20 } }
    : {};

  return (
    <div className="text-center" role="alert">
      {/* Icon */}
      <motion.div
        className="h-14 w-14 rounded-2xl mx-auto flex items-center justify-center"
        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)" }}
        {...iconAnimation}
      >
        <Clock className="h-7 w-7" style={{ color: "#fbbf24" }} />
      </motion.div>

      {/* Heading */}
      <h2 className="text-lg font-semibold tracking-tight mt-5 outline-none" style={{ color: "var(--cs-text-headline)" }} tabIndex={-1}>
        Verification link expired
      </h2>

      {/* Description */}
      <p className="text-sm leading-relaxed mt-2 max-w-[300px] mx-auto" style={{ color: "var(--cs-text-body)" }}>
        Verification links are valid for 24 hours. Request a new one to verify your email address.
      </p>

      {/* Resend section */}
      <div className="mt-6">
        {resendState === "success" && (
          <motion.p
            className="text-[12px] flex items-center justify-center gap-1.5 mb-3"
            style={{ color: "#34d399" }}
            initial={!reduced ? { opacity: 0, y: -4 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verification email sent
          </motion.p>
        )}
        {resendState === "error" && (
          <motion.p
            className="text-[12px] mb-3"
            style={{ color: "#f87171" }}
            initial={!reduced ? { opacity: 0, y: -4 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Failed to send — try again
          </motion.p>
        )}

        <button
          onClick={onResend}
          disabled={resendState === "loading" || resendCooldown > 0}
          className="font-mono-cs text-[11px] tracking-wider uppercase transition-colors duration-150 disabled:cursor-not-allowed"
          style={{ color: resendState === "loading" || resendCooldown > 0 ? "var(--cs-text-faint)" : "rgba(45,212,191,0.6)" }}
          onMouseEnter={(e) => {
            if (resendState !== "loading" && resendCooldown <= 0) e.currentTarget.style.color = "#2DD4BF";
          }}
          onMouseLeave={(e) => {
            if (resendState !== "loading" && resendCooldown <= 0) e.currentTarget.style.color = "rgba(45,212,191,0.6)";
          }}
        >
          {resendState === "loading" ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              SENDING...
            </span>
          ) : resendCooldown > 0 ? (
            `RESEND IN ${resendCooldown}S`
          ) : (
            "RESEND VERIFICATION EMAIL"
          )}
        </button>
      </div>

      {/* Back to sign in */}
      <Link
        to="/login"
        className="cs-focus cs-btn-secondary w-full h-11 rounded-lg text-sm font-medium mt-6 flex items-center justify-center"
      >
        Back to sign in
      </Link>
    </div>
  );
};
