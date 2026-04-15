"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label } from "@collabsphere/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AuthApiError,
  registerAccount,
  resendVerificationEmail,
} from "@/lib/api/auth";

import {
  AuthDivider,
  AuthErrorBanner,
  AuthStatusCard,
  OAuthButton,
} from "./auth-shell";
import { PasswordStrength } from "./password-strength";

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
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

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: (values: {
      email: string;
      fullName: string;
      password: string;
    }) => registerAccount(values),
    onSuccess: (_result, variables) => {
      setServerError(null);
      setResendMessage(null);
      setSuccessEmail(variables.email);
      reset({
        confirmPassword: "",
        email: variables.email,
        fullName: variables.fullName,
        password: "",
      });
    },
    onError: (error) => {
      setServerError(
        error instanceof AuthApiError
          ? error.message
          : "Registration could not be completed.",
      );
    },
  });

  const resendMutation = useMutation({
    mutationFn: (values: { email: string }) => resendVerificationEmail(values),
    onSuccess: (result) => {
      setResendMessage(
        result.message || "If an account exists, a verification email has been sent.",
      );
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
    registerMutation.mutate({
      email: values.email,
      fullName: values.fullName,
      password: values.password,
    });
  });

  if (successEmail) {
    return (
      <div className="space-y-5">
        <AuthStatusCard
          eyebrow="Account created"
          title="Check your inbox before signing in"
          body={`A verification email was prepared for ${successEmail}. Verify the address first, then return to login.`}
          tone="success"
        >
          <div className="space-y-3">
            {resendMessage ? (
              <p className="text-sm text-[var(--color-text-secondary)]">{resendMessage}</p>
            ) : null}
            <Button
              className="w-full"
              variant="secondary"
              size="lg"
              onClick={() => resendMutation.mutate({ email: successEmail })}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending
                ? "Sending another verification email..."
                : "Send another verification email"}
            </Button>
            <Link
              href="/login"
              className="block text-center text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              Continue to sign in
            </Link>
          </div>
        </AuthStatusCard>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {serverError ? <AuthErrorBanner message={serverError} /> : null}

      <div className="space-y-2">
        <Label htmlFor="register-full-name">Full name</Label>
        <Input
          id="register-full-name"
          autoComplete="name"
          placeholder="Jane Doe"
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p className="text-sm text-rose-200">{errors.fullName.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email address</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@workspace.com"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-rose-200">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
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
        <Label htmlFor="register-confirm-password">Confirm password</Label>
        <Input
          id="register-confirm-password"
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
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? "Creating account..." : "Create account"}
      </Button>

      <AuthDivider label="or continue with" />
      <OAuthButton href="/api/v1/auth/google" label="Continue with Google" />

      <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
        Already started onboarding?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Sign in here
        </Link>
        .
      </p>
    </form>
  );
}
