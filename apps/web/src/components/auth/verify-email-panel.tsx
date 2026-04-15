"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label } from "@collabsphere/ui";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AuthApiError,
  resendVerificationEmail,
  verifyEmailToken,
} from "@/lib/api/auth";

import { AuthErrorBanner, AuthStatusCard } from "./auth-shell";

const resendSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type ResendVerificationValues = z.infer<typeof resendSchema>;

type VerifyEmailPanelProps = {
  token: string;
};

export function VerifyEmailPanel({ token }: Readonly<VerifyEmailPanelProps>) {
  const verificationStartedRef = useRef(false);
  const [verificationState, setVerificationState] = useState<
    "pending" | "success" | "invalid" | "expired" | "missing"
  >(token ? "pending" : "missing");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ResendVerificationValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (values: { token: string }) => verifyEmailToken(values),
    onSuccess: () => {
      setVerificationState("success");
      setServerError(null);
    },
    onError: (error) => {
      if (error instanceof AuthApiError) {
        setServerError(error.message);
        if (error.kind === "token-expired") {
          setVerificationState("expired");
          return;
        }
        if (error.kind === "token-invalid") {
          setVerificationState("invalid");
          return;
        }
      }

      setVerificationState("invalid");
      setServerError("Email verification could not be completed.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: (values: ResendVerificationValues) => resendVerificationEmail(values),
    onSuccess: (result) => {
      setServerError(result.message);
    },
    onError: (error) => {
      setServerError(
        error instanceof AuthApiError
          ? error.message
          : "Verification resend could not be completed.",
      );
    },
  });

  useEffect(() => {
    if (!token || verificationStartedRef.current) {
      return;
    }

    verificationStartedRef.current = true;
    verifyMutation.mutate({ token });
  }, [token, verifyMutation]);

  const onResend = handleSubmit((values) => {
    resendMutation.mutate(values);
  });

  if (verificationState === "missing") {
    return (
      <AuthStatusCard
        eyebrow="Missing token"
        title="This verification link is incomplete"
        body="Open the full verification URL from your email or request another verification message."
        tone="danger"
      >
        <Link
          href="/register"
          className="text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Return to registration
        </Link>
      </AuthStatusCard>
    );
  }

  if (verificationState === "pending") {
    return (
      <AuthStatusCard
        eyebrow="Verifying"
        title="Checking your email token"
        body="Hold for a moment while we confirm the activation link."
      />
    );
  }

  if (verificationState === "success") {
    return (
      <AuthStatusCard
        eyebrow="Verified"
        title="Your email has been verified"
        body="You can sign in now and continue into the authenticated workspace shell."
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

  return (
    <div className="space-y-5">
      {serverError ? <AuthErrorBanner message={serverError} /> : null}
      <AuthStatusCard
        eyebrow={verificationState === "expired" ? "Expired token" : "Verification issue"}
        title={
          verificationState === "expired"
            ? "This verification link has expired"
            : "This verification link cannot be used"
        }
        body="Request another verification email by entering the same address you used during registration."
        tone="warning"
      />
      <form className="space-y-4" onSubmit={onResend}>
        <div className="space-y-2">
          <Label htmlFor="resend-email">Email address</Label>
          <Input
            id="resend-email"
            type="email"
            autoComplete="email"
            placeholder="you@workspace.com"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-rose-200">{errors.email.message}</p>
          ) : null}
        </div>
        <Button
          className="w-full"
          size="lg"
          type="submit"
          disabled={resendMutation.isPending}
        >
          {resendMutation.isPending
            ? "Sending verification email..."
            : "Send another verification email"}
        </Button>
      </form>
    </div>
  );
}
