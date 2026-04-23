import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthErrorBanner } from "./auth-error-banner";
import { AuthDivider } from "./auth-divider";
import { OAuthButton } from "./oauth-button";
import { PasswordStrength, getPasswordStrength } from "./password-strength";
import { EmailSentCard } from "./email-sent-card";

const registerSchema = z
  .object({
    fullName: z.string().min(1, "Name is required").min(2, "Too short").max(100),
    email: z.string().min(1, "Email is required").email("Invalid email"),
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

type RegisterValues = z.infer<typeof registerSchema>;

interface ServerError {
  type: string;
  message: string;
}

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const watchedPassword = form.watch("password");
  const passwordStrength = getPasswordStrength(watchedPassword);

  const wName = form.watch("fullName");
  const wEmail = form.watch("email");
  const wConfirm = form.watch("confirmPassword");

  useEffect(() => {
    if (serverError) setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wName, wEmail, watchedPassword, wConfirm]);

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    // Mock registration: simulate latency, then show "check email" card
    await new Promise((r) => setTimeout(r, 600));
    setSubmittedEmail(values.email);
    setIsSubmitted(true);
  };

  const handleResend = async () => {
    await new Promise((r) => setTimeout(r, 400));
  };

  const inputClass = "w-full h-11 px-3.5 rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-[color:var(--cs-teal-primary)] focus:ring-1 focus:ring-[color:var(--cs-teal-faint)]";
  const inputStyle = {
    background: "var(--cs-base)",
    border: "1px solid var(--cs-teal-faint)",
    color: "var(--cs-text-headline)",
  };
  const errorBorder = { borderColor: "rgba(239,68,68,0.4)" };

  return (
    <AnimatePresence mode="wait">
      {isSubmitted ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <EmailSentCard
            email={submittedEmail}
            heading="Check your email"
            description="We sent a verification link to"
            descriptionSuffix="Click the link to activate your account"
            resendLabel="RESEND VERIFICATION EMAIL"
            onResend={handleResend}
            backLabel="Back to sign in"
            backHref="/login"
          />
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--cs-text-headline)" }}>Create your account</h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--cs-text-muted)" }}>Start collaborating with your team in minutes</p>

          <AnimatePresence>
            {serverError && (
              <AuthErrorBanner
                variant="error"
                message={serverError.message}
                action={serverError.type === "exists" ? { label: "Sign in instead", onClick: () => { navigate("/login"); } } : undefined}
              />
            )}
          </AnimatePresence>

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6">
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="text-sm font-medium block mb-1.5" style={{ color: "var(--cs-text-body)" }}>Full name</label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Elshaday Tesfaye"
                className={inputClass}
                style={{ ...inputStyle, ...(form.formState.errors.fullName ? errorBorder : {}) }}
                {...form.register("fullName")}
                aria-describedby={form.formState.errors.fullName ? "fullName-error" : undefined}
              />
              {form.formState.errors.fullName && (
                <p id="fullName-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mt-4">
              <label htmlFor="reg-email" className="text-sm font-medium block mb-1.5" style={{ color: "var(--cs-text-body)" }}>Email</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                style={{ ...inputStyle, ...(form.formState.errors.email ? errorBorder : {}) }}
                {...form.register("email")}
                aria-describedby={form.formState.errors.email ? "reg-email-error" : undefined}
              />
              {form.formState.errors.email && (
                <p id="reg-email-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mt-4">
              <label htmlFor="reg-password" className="text-sm font-medium block mb-1.5" style={{ color: "var(--cs-text-body)" }}>Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                  style={{ ...inputStyle, ...(form.formState.errors.password ? errorBorder : {}) }}
                  {...form.register("password")}
                  aria-describedby={form.formState.errors.password ? "reg-password-error" : undefined}
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
                <p id="reg-password-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.password.message}
                </p>
              )}
              {watchedPassword.length > 0 && <PasswordStrength password={watchedPassword} />}
            </div>

            {/* Confirm password */}
            <div className="mt-4">
              <label htmlFor="confirmPassword" className="text-sm font-medium block mb-1.5" style={{ color: "var(--cs-text-body)" }}>Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputClass}
                style={{ ...inputStyle, ...(form.formState.errors.confirmPassword ? errorBorder : {}) }}
                {...form.register("confirmPassword")}
                aria-describedby={form.formState.errors.confirmPassword ? "confirm-error" : undefined}
              />
              {form.formState.errors.confirmPassword && (
                <p id="confirm-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={form.formState.isSubmitting || passwordStrength < 4}
              className="cs-focus cs-btn-primary shine-effect w-full h-11 rounded-lg text-sm font-semibold mt-6 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "rgba(240,253,250,0.7)" }} /> : "Create account"}
            </button>
          </form>

          <AuthDivider />
          <OAuthButton label="Sign up with Google" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
