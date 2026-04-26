import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AuthStatusCard } from "./auth-status-card";

type VerifyEmailApiErrorCode =
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "TOKEN_ALREADY_USED"
  | "VALIDATION_ERROR";

class VerifyEmailApiError extends Error {
  constructor(
    public readonly code: VerifyEmailApiErrorCode,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "VerifyEmailApiError";
  }
}

interface VerifyEmailHandlerProps {
  token: string;
}

const requestNewVerificationHref = "/login";

const verifyEmailToken = async (token: string) => {
  const response = await fetch("/api/v1/auth/verify-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { code?: VerifyEmailApiErrorCode; message?: string } }
      | null;
    const code = body?.error?.code ?? "TOKEN_INVALID";
    const message = body?.error?.message ?? "Unable to verify email address.";
    throw new VerifyEmailApiError(code, response.status, message);
  }

  return response.json().catch(() => null);
};

export const VerifyEmailHandler = ({ token }: VerifyEmailHandlerProps) => {
  const normalizedToken = token.trim();
  const hasTriggeredVerificationRef = useRef(false);
  const {
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    mutate,
  } = useMutation({
    mutationFn: verifyEmailToken,
    retry: false,
  });

  useEffect(() => {
    if (!normalizedToken || hasTriggeredVerificationRef.current) {
      return;
    }

    hasTriggeredVerificationRef.current = true;
    mutate(normalizedToken);
  }, [mutate, normalizedToken]);

  const transition = { duration: 0.25 };
  const motionProps = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition,
  };

  const errorCode = error instanceof VerifyEmailApiError ? error.code : "TOKEN_INVALID";

  return (
    <AnimatePresence mode="wait">
      {!normalizedToken ? (
        <motion.div key="missing-token" {...motionProps}>
          <AuthStatusCard
            variant="error"
            heading="Invalid link"
            description="This verification link is not valid. It may have been copied incorrectly. Go to sign in to request a new verification email."
            action={{
              label: "Go to sign in to request a new verification email",
              href: requestNewVerificationHref,
            }}
            secondaryAction={{ label: "Back to sign in", href: "/login" }}
          />
        </motion.div>
      ) : null}

      {normalizedToken && (isPending || isIdle) ? (
        <motion.div key="loading" {...motionProps}>
          <AuthStatusCard
            variant="loading"
            heading="Verifying your email"
            description="Please wait while we confirm your email address."
          />
        </motion.div>
      ) : null}

      {isSuccess ? (
        <motion.div key="success" {...motionProps}>
          <AuthStatusCard
            variant="success"
            heading="Email verified"
            description="Your email address has been confirmed. You can now sign in to CollabSphere and continue."
            action={{ label: "Continue to sign in", href: "/login" }}
          />
        </motion.div>
      ) : null}

      {isError && errorCode === "TOKEN_ALREADY_USED" ? (
        <motion.div key="already-used" {...motionProps}>
          <AuthStatusCard
            variant="success"
            heading="Already verified"
            description="This verification link has already been used. Your email may already be confirmed, so you can continue to sign in."
            action={{ label: "Continue to sign in", href: "/login" }}
          />
        </motion.div>
      ) : null}

      {isError && errorCode === "TOKEN_EXPIRED" ? (
        <motion.div key="expired" {...motionProps}>
          <AuthStatusCard
            variant="expired"
            heading="Verification link expired"
            description="Verification links are valid for 24 hours. Go to sign in to request a new verification email."
            action={{
              label: "Go to sign in to request a new verification email",
              href: requestNewVerificationHref,
            }}
            secondaryAction={{ label: "Back to sign in", href: "/login" }}
          />
        </motion.div>
      ) : null}

      {isError && (errorCode === "TOKEN_INVALID" || errorCode === "VALIDATION_ERROR") ? (
        <motion.div key="invalid" {...motionProps}>
          <AuthStatusCard
            variant="error"
            heading="Invalid link"
            description="This verification link is not valid. It may have been copied incorrectly. Go to sign in to request a new verification email."
            action={{
              label: "Go to sign in to request a new verification email",
              href: requestNewVerificationHref,
            }}
            secondaryAction={{ label: "Back to sign in", href: "/login" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
