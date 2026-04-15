"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label } from "@collabsphere/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AuthApiError,
  loginWithPassword,
  resendVerificationEmail,
} from "@/lib/api/auth";

import {
  AuthDivider,
  AuthErrorBanner,
  AuthStatusCard,
  OAuthButton,
} from "./auth-shell";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  onSuccessRedirect?: (href: string) => void;
};

const resolveSafeNextHref = (nextParam: string | null) => {
  if (!nextParam) {
    return "/dashboard";
  }

  try {
    const decoded = decodeURIComponent(nextParam);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return "/dashboard";
    }

    const resolvedUrl = new URL(decoded, window.location.origin);
    if (resolvedUrl.origin !== window.location.origin) {
      return "/dashboard";
    }

    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return "/dashboard";
  }
};

export function LoginForm({
  onSuccessRedirect = (href) => window.location.assign(href),
}: Readonly<LoginFormProps>) {
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => loginWithPassword(values),
    onSuccess: () => {
      const nextHref = resolveSafeNextHref(searchParams.get("next"));
      onSuccessRedirect(nextHref);
    },
    onError: (error) => {
      if (error instanceof AuthApiError && error.code === "EMAIL_NOT_VERIFIED") {
        setShowResend(true);
        setServerError("Verify your email before signing in.");
        return;
      }

      setServerError(
        error instanceof AuthApiError ? error.message : "Sign in could not be completed.",
      );
    },
  });

  const resendMutation = useMutation({
    mutationFn: (values: { email: string }) => resendVerificationEmail(values),
    onSuccess: (result) => {
      setResendMessage(result.message);
      setServerError(null);
    },
    onError: (error) => {
      setResendMessage(null);
      setServerError(
        error instanceof AuthApiError
          ? error.message
          : "Verification resend could not be completed.",
      );
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    setResendMessage(null);
    setShowResend(false);
    loginMutation.mutate(values);
  });

  const requestAnotherVerification = () => {
    const email = getValues("email");
    if (!email) {
      setServerError("Enter your email address before requesting another verification email.");
      return;
    }

    resendMutation.mutate({ email });
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {serverError ? <AuthErrorBanner message={serverError} /> : null}
      {resendMessage ? (
        <AuthStatusCard
          eyebrow="Verification sent"
          title="Check your inbox"
          body={resendMessage}
          tone="success"
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="login-email">Email address</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@workspace.com"
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="login-email-error" className="text-sm text-[var(--color-error)]">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="login-password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-describedby={errors.password ? "login-password-error" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p id="login-password-error" className="text-sm text-[var(--color-error)]">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button
        className="w-full"
        size="lg"
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Signing in..." : "Sign in"}
      </Button>

      {showResend ? (
        <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[rgba(12,25,24,0.7)] p-4">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Need another verification email?
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
            We will send the same generic response whether the account exists or
            not.
          </p>
          <Button
            className="mt-4 w-full"
            variant="secondary"
            size="lg"
            type="button"
            onClick={requestAnotherVerification}
            disabled={resendMutation.isPending}
          >
            {resendMutation.isPending
              ? "Sending verification email..."
              : "Resend verification"}
          </Button>
        </div>
      ) : null}

      <AuthDivider label="or continue with" />
      <OAuthButton href="/api/v1/auth/google" label="Continue with Google" />
    </form>
  );
}
