import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, KeyRound, Loader2, Shield } from "lucide-react";
import { AuthErrorBanner } from "./auth-error-banner";
import { EmailSentCard } from "./email-sent-card";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export const ForgotPasswordForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const watchedEmail = form.watch("email");

  useEffect(() => {
    if (serverError) setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedEmail]);

  const onSubmit = async (values: ForgotValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email.trim().toLowerCase() }),
      });
      if (response.status === 429) {
        setServerError("Too many requests. Please wait a moment before trying again.");
        return;
      }
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
    } catch {
      setServerError("Unable to connect. Check your internet and try again.");
    }
  };

  const handleResend = async () => {
    await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: submittedEmail }),
    });
  };

  const inputClass = "w-full h-11 px-3.5 rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-[color:var(--cs-teal-primary)] focus:ring-1 focus:ring-[color:var(--cs-teal-faint)]";
  const inputStyle = {
    background: "var(--cs-base)",
    border: "1px solid var(--cs-teal-faint)",
    color: "var(--cs-text-headline)",
  };

  return (
    <AnimatePresence mode="wait">
      {isSubmitted ? (
        <motion.div key="sent" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
          <EmailSentCard
            email={submittedEmail}
            heading="Check your email"
            description="We sent a password reset link to"
            descriptionSuffix="The link expires in 1 hour"
            resendLabel="RESEND RESET LINK"
            onResend={handleResend}
            backLabel="Back to sign in"
            backHref="/login"
          />
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
          {/* Icon heading */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}>
              <KeyRound className="h-5 w-5" style={{ color: "var(--cs-teal-primary)" }} />
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--cs-text-headline)" }}>Reset password</h1>
          </div>

          <p className="text-sm leading-relaxed mt-4" style={{ color: "var(--cs-text-body)" }}>
            Enter the email address associated with your account. We'll send you a link to create a new password.
          </p>

          <AnimatePresence>
            {serverError && <AuthErrorBanner variant="error" message={serverError} />}
          </AnimatePresence>

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6">
            <div>
              <label htmlFor="forgot-email" className="text-sm font-medium block mb-1.5" style={{ color: "var(--cs-text-body)" }}>Email address</label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                className={inputClass}
                style={{ ...inputStyle, ...(form.formState.errors.email ? { borderColor: "rgba(239,68,68,0.4)" } : {}) }}
                {...form.register("email")}
                aria-describedby={form.formState.errors.email ? "forgot-email-error" : undefined}
              />
              {form.formState.errors.email && (
                <p id="forgot-email-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="cs-focus cs-btn-primary shine-effect w-full h-11 rounded-lg text-sm font-semibold mt-6 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "rgba(240,253,250,0.7)" }} />
              ) : (
                <>Send reset link <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="flex items-start gap-2 mt-6" style={{ color: "var(--cs-text-faint)" }}>
            <Shield className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-mono-cs text-[10px] leading-relaxed">
              For security, we'll send a reset link regardless of whether an account exists with this email.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
