import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, LockKeyhole, Loader2 } from "lucide-react";
import { AuthErrorBanner } from "./auth-error-banner";
import { AuthStatusCard } from "./auth-status-card";
import { PasswordStrength, getPasswordStrength } from "./password-strength";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Needs lowercase")
      .regex(/[A-Z]/, "Needs uppercase")
      .regex(/\d/, "Needs a number")
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Needs special character"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

type PageState =
  | { kind: "loading" }
  | { kind: "form" }
  | { kind: "success" }
  | { kind: "error"; errorType: "invalid" | "expired" | "used" };

interface ResetPasswordFormProps {
  token: string;
}

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [pageState, setPageState] = useState<PageState>({ kind: "loading" });
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const watchedPassword = form.watch("password");
  const passwordStrength = getPasswordStrength(watchedPassword);

  // Validate token on mount
  useEffect(() => {
    const validate = async () => {
      try {
        const res = await fetch("/api/v1/auth/reset-password/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const code = body?.error?.code;
          if (code === "TOKEN_EXPIRED") { setPageState({ kind: "error", errorType: "expired" }); return; }
          if (code === "TOKEN_ALREADY_USED") { setPageState({ kind: "error", errorType: "used" }); return; }
          setPageState({ kind: "error", errorType: "invalid" });
          return;
        }
        setPageState({ kind: "form" });
      } catch {
        setPageState({ kind: "error", errorType: "invalid" });
      }
    };
    validate();
  }, [token]);

  const onSubmit = async (values: ResetValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const code = body?.error?.code;
        if (code === "TOKEN_EXPIRED") { setPageState({ kind: "error", errorType: "expired" }); return; }
        if (code === "TOKEN_ALREADY_USED") { setPageState({ kind: "error", errorType: "used" }); return; }
        if (code === "TOKEN_INVALID") { setPageState({ kind: "error", errorType: "invalid" }); return; }
        setServerError(code === "VALIDATION_ERROR" ? "Password doesn't meet requirements. Please try again." : "Something went wrong. Please try again.");
        return;
      }
      setPageState({ kind: "success" });
    } catch {
      setServerError("Unable to connect. Check your internet and try again.");
    }
  };

  const inputClass = "w-full h-11 px-3.5 rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-[color:var(--cs-teal-primary)] focus:ring-1 focus:ring-[color:var(--cs-teal-faint)]";
  const inputStyle = { background: "var(--cs-surface)", border: "1px solid var(--cs-teal-faint)", color: "var(--cs-text-headline)" };
  const errorBorder = { borderColor: "rgba(239,68,68,0.4)" };

  const transition = { duration: 0.25 };
  const motionProps = { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.98 }, transition };

  return (
    <AnimatePresence mode="wait">
      {pageState.kind === "loading" && (
        <motion.div key="loading" {...motionProps}>
          <AuthStatusCard variant="loading" heading="Validating your link" description="Please wait while we verify your password reset link." />
        </motion.div>
      )}

      {pageState.kind === "success" && (
        <motion.div key="success" {...motionProps}>
          <AuthStatusCard
            variant="success"
            heading="Password updated"
            description="Your password has been reset successfully. You can now sign in with your new password."
            action={{ label: "Sign in", href: "/login" }}
          />
        </motion.div>
      )}

      {pageState.kind === "error" && pageState.errorType === "expired" && (
        <motion.div key="expired" {...motionProps}>
          <AuthStatusCard
            variant="expired"
            heading="Link expired"
            description="Password reset links are valid for 1 hour. Request a new one to continue."
            action={{ label: "Request new link", href: "/forgot-password" }}
            secondaryAction={{ label: "Back to sign in", href: "/login" }}
          />
        </motion.div>
      )}

      {pageState.kind === "error" && pageState.errorType === "used" && (
        <motion.div key="used" {...motionProps}>
          <AuthStatusCard
            variant="success"
            heading="Already reset"
            description="This password reset link has already been used. If you need to reset again, request a new link."
            action={{ label: "Request new link", href: "/forgot-password" }}
            secondaryAction={{ label: "Sign in", href: "/login" }}
          />
        </motion.div>
      )}

      {pageState.kind === "error" && pageState.errorType === "invalid" && (
        <motion.div key="invalid" {...motionProps}>
          <AuthStatusCard
            variant="error"
            heading="Invalid link"
            description="This password reset link is not valid. It may have been copied incorrectly."
            action={{ label: "Request new link", href: "/forgot-password" }}
            secondaryAction={{ label: "Back to sign in", href: "/login" }}
          />
        </motion.div>
      )}

      {pageState.kind === "form" && (
        <motion.div key="form" {...motionProps}>
          {/* Icon heading */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}>
              <LockKeyhole className="h-5 w-5" style={{ color: "var(--cs-teal-primary)" }} />
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--cs-text-headline)" }}>Set new password</h1>
          </div>

          <p className="text-sm leading-relaxed mt-4" style={{ color: "var(--cs-text-body)" }}>
            Choose a strong password for your account. You'll use this to sign in going forward.
          </p>

          <AnimatePresence>
            {serverError && <AuthErrorBanner variant="error" message={serverError} />}
          </AnimatePresence>

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6">
            {/* New password */}
            <div>
              <label htmlFor="new-password" className="text-sm font-medium block mb-1.5" style={{ color: "var(--cs-text-body)" }}>New password</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  autoFocus
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                  style={{ ...inputStyle, ...(form.formState.errors.password ? errorBorder : {}) }}
                  {...form.register("password")}
                  aria-describedby={form.formState.errors.password ? "new-pw-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center rounded-r-lg transition-colors duration-150"
                  style={{ color: "var(--cs-text-faint)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cs-text-body)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--cs-text-faint)"; }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p id="new-pw-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                  <AlertCircle className="h-3.5 w-3.5" />{form.formState.errors.password.message}
                </p>
              )}
              {watchedPassword.length > 0 && <PasswordStrength password={watchedPassword} />}
            </div>

            {/* Confirm */}
            <div className="mt-4">
              <label htmlFor="confirm-new-pw" className="text-sm font-medium block mb-1.5" style={{ color: "var(--cs-text-body)" }}>Confirm new password</label>
              <input
                id="confirm-new-pw"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputClass}
                style={{ ...inputStyle, ...(form.formState.errors.confirmPassword ? errorBorder : {}) }}
                {...form.register("confirmPassword")}
                aria-describedby={form.formState.errors.confirmPassword ? "confirm-new-pw-error" : undefined}
              />
              {form.formState.errors.confirmPassword && (
                <p id="confirm-new-pw-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                  <AlertCircle className="h-3.5 w-3.5" />{form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting || passwordStrength < 4}
              className="cs-focus cs-btn-primary shine-effect w-full h-11 rounded-lg text-sm font-semibold mt-6 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "rgba(240,253,250,0.7)" }} /> : "Reset password"}
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
