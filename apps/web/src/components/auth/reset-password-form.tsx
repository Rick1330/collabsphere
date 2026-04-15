"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label } from "@collabsphere/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthApiError, resetPassword } from "@/lib/api/auth";

import { AuthErrorBanner, AuthStatusCard } from "./auth-shell";
import { PasswordStrength } from "./password-strength";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Z]/u, "Include an uppercase letter.")
      .regex(/[a-z]/u, "Include a lowercase letter.")
      .regex(/\d/u, "Include a number.")
      .regex(/[^A-Za-z0-9]/u, "Include a special character."),
    confirmPassword: z.string().min(8, "Confirm the password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type ResetPasswordFormProps = {
  token: string;
};

type ResetTokenState = "idle" | "invalid" | "expired";
type ResetPasswordCardState =
  | {
      body: string;
      eyebrow: string;
      href: "/forgot-password" | "/login";
      linkLabel: string;
      title: string;
      tone: "danger" | "success" | "warning";
    }
  | null;

const buildResetTokenStateCopy = (tokenState: Exclude<ResetTokenState, "idle">) => ({
  body:
    tokenState === "expired"
      ? "Request a new reset email and start again with the latest link."
      : "The token was invalid, consumed, or malformed. Request a new reset email.",
  eyebrow: tokenState === "expired" ? "Expired reset link" : "Invalid reset link",
  title:
    tokenState === "expired"
      ? "This reset link has expired"
      : "This reset link cannot be used",
});

const getResetPasswordCardState = ({
  successMessage,
  token,
  tokenState,
}: {
  successMessage: string | null;
  token: string;
  tokenState: ResetTokenState;
}): ResetPasswordCardState => {
  if (!token) {
    return {
      body: "Open the full reset link from your email or request a new reset message.",
      eyebrow: "Missing token",
      href: "/forgot-password",
      linkLabel: "Request another reset link",
      title: "This reset link is incomplete",
      tone: "danger",
    };
  }

  if (successMessage) {
    return {
      body: `${successMessage} Sign in again because existing sessions were invalidated.`,
      eyebrow: "Password updated",
      href: "/login",
      linkLabel: "Continue to sign in",
      title: "Your password has been changed",
      tone: "success",
    };
  }

  if (tokenState === "invalid" || tokenState === "expired") {
    const stateCopy = buildResetTokenStateCopy(tokenState);
    return {
      ...stateCopy,
      href: "/forgot-password",
      linkLabel: "Request another reset link",
      tone: "warning",
    };
  }

  return null;
};

function ResetLinkStatusCard({
  body,
  eyebrow,
  href,
  linkLabel,
  title,
  tone,
}: Readonly<{
  body: string;
  eyebrow: string;
  href: "/forgot-password" | "/login";
  linkLabel: string;
  title: string;
  tone: "danger" | "success" | "warning";
}>) {
  return (
    <AuthStatusCard
      eyebrow={eyebrow}
      title={title}
      body={body}
      tone={tone}
    >
      <Link
        href={href}
        className="text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
      >
        {linkLabel}
      </Link>
    </AuthStatusCard>
  );
}

export function ResetPasswordForm({
  token,
}: Readonly<ResetPasswordFormProps>) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<ResetTokenState>("idle");
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: (values: { newPassword: string; token: string }) =>
      resetPassword(values),
    onSuccess: (result) => {
      setSuccessMessage(result.message || "Password updated successfully.");
      setServerError(null);
    },
    onError: (error) => {
      if (error instanceof AuthApiError) {
        const nextTokenState =
          error.kind === "token-expired"
            ? "expired"
            : error.kind === "token-invalid"
              ? "invalid"
              : "idle";
        setTokenState(nextTokenState);
        setServerError(error.message);
        return;
      }

      setServerError("Password update could not be completed.");
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    resetMutation.mutate({
      newPassword: values.password,
      token,
    });
  });

  const cardState = getResetPasswordCardState({
    successMessage,
    token,
    tokenState,
  });
  if (cardState) {
    return (
      <ResetLinkStatusCard
        body={cardState.body}
        eyebrow={cardState.eyebrow}
        href={cardState.href}
        linkLabel={cardState.linkLabel}
        title={cardState.title}
        tone={cardState.tone}
      />
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {serverError ? <AuthErrorBanner message={serverError} /> : null}

      <div className="space-y-2">
        <Label htmlFor="reset-password">New password</Label>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          aria-describedby={errors.password ? "reset-password-error" : undefined}
          {...register("password")}
        />
        <PasswordStrength password={watch("password")} />
        {errors.password ? (
          <p id="reset-password-error" className="text-sm text-[var(--color-error)]">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-password-confirm">Confirm password</Label>
        <Input
          id="reset-password-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          aria-describedby={
            errors.confirmPassword ? "reset-password-confirm-error" : undefined
          }
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p
            id="reset-password-confirm-error"
            className="text-sm text-[var(--color-error)]"
          >
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button
        className="w-full"
        size="lg"
        type="submit"
        disabled={resetMutation.isPending}
      >
        {resetMutation.isPending ? "Updating password..." : "Update password"}
      </Button>
    </form>
  );
}
