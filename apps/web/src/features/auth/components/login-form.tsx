import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AuthErrorBanner } from "./auth-error-banner";
import { AuthDivider } from "./auth-divider";
import { OAuthButton } from "./oauth-button";
import { login, AuthError } from "@/api/adapters/auth";
import { findAccountById } from "@/lib/mock-accounts";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

interface ServerError {
  type: "error" | "warning" | "success";
  message: string;
}

/** Choose a sensible post-login destination based on the account. */
function defaultDestinationFor(accountId: string): string {
  const account = findAccountById(accountId);
  if (!account) return "/dashboard";
  // Land users in their default workspace context if they have one.
  if (account.defaultWorkspaceId) {
    return `/w/${account.defaultWorkspaceId}`;
  }
  return "/dashboard";
}

export const LoginForm = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const watchedEmail = form.watch("email");
  const watchedPassword = form.watch("password");

  useEffect(() => {
    if (serverError && serverError.type !== "success") {
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedEmail, watchedPassword]);

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const session = await login({ email: values.email, password: values.password });
      // Invalidate any cached "current user" queries so guards/profile re-resolve.
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });

      const next = params.get("next");
      const destination = next ? decodeURIComponent(next) : defaultDestinationFor(session.user.id);
      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.code === "EMAIL_NOT_VERIFIED") {
          setServerError({ type: "warning", message: err.message });
        } else {
          setServerError({ type: "error", message: err.message });
        }
        return;
      }
      setServerError({ type: "error", message: "Unable to sign in. Please try again." });
    }
  };

  const inputClass = "w-full h-11 px-3.5 rounded-lg text-sm transition-all duration-150 focus:outline-none placeholder:font-normal";
  const inputStyle = {
    background: "var(--cs-surface)",
    border: "1px solid var(--cs-teal-faint)",
    color: "var(--cs-text-headline)",
  };
  const inputFocusStyle = "focus:border-[color:var(--cs-teal-primary)] focus:ring-1 focus:ring-[color:var(--cs-teal-faint)]";

  const bannerVariant =
    serverError?.type === "success" ? "success" : serverError?.type === "warning" ? "warning" : "error";

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--cs-text-headline)" }}>Sign in</h1>
      <p className="text-sm mt-1.5" style={{ color: "var(--cs-text-muted)" }}>Enter your credentials to access your workspace</p>

      <AnimatePresence>
        {serverError && (
          <AuthErrorBanner
            variant={bannerVariant}
            message={serverError.message}
          />
        )}
      </AnimatePresence>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="text-sm font-medium block mb-1.5" style={{ color: "var(--cs-text-body)" }}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`${inputClass} ${inputFocusStyle}`}
            style={{ ...inputStyle, ...(form.formState.errors.email ? { borderColor: "rgba(239,68,68,0.4)" } : {}) }}
            {...form.register("email")}
            aria-describedby={form.formState.errors.email ? "email-error" : undefined}
          />
          {form.formState.errors.email && (
            <p id="email-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
              <AlertCircle className="h-3.5 w-3.5" />
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--cs-text-body)" }}>Password</label>
            <Link to="/forgot-password" className="text-sm font-medium transition-colors duration-150" style={{ color: "rgba(45,212,191,0.7)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#2DD4BF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(45,212,191,0.7)"; }}
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${inputClass} ${inputFocusStyle} pr-11`}
              style={{ ...inputStyle, ...(form.formState.errors.password ? { borderColor: "rgba(239,68,68,0.4)" } : {}) }}
              {...form.register("password")}
              aria-describedby={form.formState.errors.password ? "password-error" : undefined}
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
            <p id="password-error" className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "#f87171" }}>
              <AlertCircle className="h-3.5 w-3.5" />
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="cs-focus cs-btn-primary shine-effect w-full h-11 rounded-lg text-sm font-semibold mt-6 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "rgba(240,253,250,0.7)" }} /> : "Sign in"}
        </button>
      </form>

      <AuthDivider />
      <OAuthButton />

      {/* Keyboard hint */}
      <div className="hidden sm:flex items-center justify-center gap-2 mt-6 font-mono-cs text-[10px] tracking-wider" style={{ color: "var(--cs-text-faint)" }}>
        <span>PRESS</span>
        <kbd className="cs-keycap h-6 min-w-[24px] px-1.5 text-[10px]">↵</kbd>
        <span>TO SIGN IN</span>
      </div>
    </div>
  );
};
