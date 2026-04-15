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

export function ResetPasswordForm({
  token,
}: Readonly<ResetPasswordFormProps>) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<"idle" | "invalid" | "expired">("idle");
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
      setSuccessMessage(result.message);
      setServerError(null);
    },
    onError: (error) => {
      if (error instanceof AuthApiError) {
        if (error.kind === "token-expired") {
          setTokenState("expired");
        } else if (error.kind === "token-invalid") {
          setTokenState("invalid");
        }

        setServerError(error.message);
        return;
      }

      setServerError("Password update could not be completed.");
    },
  });

  if (!token) {
    return (
      <AuthStatusCard
        eyebrow="Missing token"
        title="This reset link is incomplete"
        body="Open the full reset link from your email or request a new reset message."
        tone="danger"
      >
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Request another reset link
        </Link>
      </AuthStatusCard>
    );
  }

  if (successMessage) {
    return (
      <AuthStatusCard
        eyebrow="Password updated"
        title="Your password has been changed"
        body={`${successMessage} Sign in again because existing sessions were invalidated.`}
        tone="success"
      >
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Continue to sign in
        </Link>
      </AuthStatusCard>
    );
  }

  if (tokenState === "invalid" || tokenState === "expired") {
    return (
      <AuthStatusCard
        eyebrow={tokenState === "expired" ? "Expired reset link" : "Invalid reset link"}
        title={
          tokenState === "expired"
            ? "This reset link has expired"
            : "This reset link cannot be used"
        }
        body={
          tokenState === "expired"
            ? "Request a new reset email and start again with the latest link."
            : "The token was invalid, consumed, or malformed. Request a new reset email."
        }
        tone="warning"
      >
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Request another reset link
        </Link>
      </AuthStatusCard>
    );
  }

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    resetMutation.mutate({
      newPassword: values.password,
      token,
    });
  });

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
          {...register("password")}
        />
        <PasswordStrength password={watch("password")} />
        {errors.password ? (
          <p className="text-sm text-rose-200">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-password-confirm">Confirm password</Label>
        <Input
          id="reset-password-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-rose-200">{errors.confirmPassword.message}</p>
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
