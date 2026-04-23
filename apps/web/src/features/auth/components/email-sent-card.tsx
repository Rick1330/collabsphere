import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

interface EmailSentCardProps {
  email: string;
  heading: string;
  description: string;
  descriptionSuffix: string;
  resendLabel: string;
  onResend: () => Promise<void>;
  backLabel: string;
  backHref: string;
}

type ResendState = "idle" | "loading" | "success" | "error" | "cooldown";

export const EmailSentCard = ({
  email,
  heading,
  description,
  descriptionSuffix,
  resendLabel,
  onResend,
  backLabel,
  backHref,
}: EmailSentCardProps) => {
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [countdown, setCountdown] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      if (resendState === "cooldown") setResendState("idle");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, resendState]);

  const handleResend = useCallback(async () => {
    if (resendState === "loading" || resendState === "cooldown") return;
    setResendState("loading");
    try {
      await onResend();
      setResendState("success");
      setTimeout(() => {
        setResendState("cooldown");
        setCountdown(60);
      }, 2000);
    } catch {
      setResendState("error");
    }
  }, [onResend, resendState]);

  const resendText = {
    idle: resendLabel,
    loading: "SENDING...",
    success: "SENT — CHECK YOUR INBOX",
    error: "FAILED — TRY AGAIN",
    cooldown: `RESEND IN ${countdown}S`,
  };

  const resendColor = {
    idle: "rgba(45,212,191,0.6)",
    loading: "var(--cs-text-muted)",
    success: "rgba(52,211,153,0.7)",
    error: "rgba(248,113,113,0.7)",
    cooldown: "var(--cs-text-faint)",
  };

  return (
    <div className="text-center">
      {/* Animated icon */}
      <motion.div
        className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center"
        style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
      >
        <motion.div
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Mail className="h-7 w-7" style={{ color: "var(--cs-teal-primary)" }} />
        </motion.div>
      </motion.div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold tracking-tight mt-6 outline-none"
        style={{ color: "var(--cs-text-headline)" }}
      >
        {heading}
      </h2>

      <p className="text-sm leading-relaxed mt-2 max-w-[300px] mx-auto" style={{ color: "var(--cs-text-body)" }}>
        {description}{" "}
        <span style={{ color: "var(--cs-text-headline)" }}>{email}</span>
        . {descriptionSuffix}
      </p>

      {/* Resend */}
      <div className="mt-6">
        <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Didn't receive it?</p>
        <button
          onClick={handleResend}
          disabled={resendState === "cooldown" || resendState === "loading"}
          className="font-mono-cs text-[11px] tracking-wider uppercase mt-2 transition-colors duration-150 disabled:cursor-not-allowed inline-flex items-center gap-2"
          style={{ color: resendColor[resendState] }}
        >
          {resendState === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
          {resendState === "success" && <CheckCircle className="h-3 w-3" />}
          {resendText[resendState]}
        </button>
      </div>

      {/* Back */}
      <a
        href={backHref}
        className="mt-8 w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 cs-focus"
        style={{
          background: "var(--cs-base)",
          border: "1px solid var(--cs-teal-faint)",
          color: "var(--cs-text-body)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(20,184,166,0.25)";
          e.currentTarget.style.color = "var(--cs-text-headline)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--cs-teal-faint)";
          e.currentTarget.style.color = "var(--cs-text-body)";
        }}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </a>
    </div>
  );
};
