"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label } from "@collabsphere/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthApiError, requestPasswordReset } from "@/lib/api/auth";

import { AuthErrorBanner, AuthStatusCard } from "./auth-shell";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) => requestPasswordReset(values),
    onSuccess: (result) => {
      setSuccessMessage(result.message);
      setServerError(null);
    },
    onError: (error) => {
      setSuccessMessage(null);
      setServerError(
        error instanceof AuthApiError
          ? error.message
          : "Password reset could not be completed.",
      );
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    forgotPasswordMutation.mutate(values);
  });

  if (successMessage) {
    return (
      <AuthStatusCard
        eyebrow="Reset link requested"
        title="Check your inbox"
        body={successMessage}
        tone="success"
      >
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Return to sign in
        </Link>
      </AuthStatusCard>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {serverError ? <AuthErrorBanner message={serverError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="forgot-password-email">Email address</Label>
        <Input
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          placeholder="you@workspace.com"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-rose-400">{errors.email.message}</p>
        ) : null}
      </div>
      <Button
        className="w-full"
        size="lg"
        type="submit"
        disabled={forgotPasswordMutation.isPending}
      >
        {forgotPasswordMutation.isPending
          ? "Requesting reset link..."
          : "Send reset link"}
      </Button>
    </form>
  );
}
