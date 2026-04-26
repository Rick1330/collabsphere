import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AuthStatusCard } from "./auth-status-card";

type VerifyEmailApiErrorCode =
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "TOKEN_ALREADY_USED"
  | "VALIDATION_ERROR";
type ViewState = "missing" | "loading" | "success" | "expired" | "already-used" | "invalid" | "transient-error";

class VerifyEmailApiError extends Error {
  constructor(
    public readonly code: string,
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

const invalidCardConfig = {
  variant: "error" as const,
  heading: "Invalid link",
  description:
    "This verification link is not valid. It may have been copied incorrectly. Go to sign in to request a new verification email.",
  action: {
    label: "Back to sign in",
    href: "/login",
  },
  secondaryAction: { label: "Back to sign in", href: "/login" },
};

const viewStateCardConfig: Record<
  ViewState,
  {
    variant: "loading" | "success" | "error" | "expired";
    heading: string;
    description: string;
    action?: { label: string; href: string };
    secondaryAction?: { label: string; href: string };
  }
> = {
  missing: invalidCardConfig,
  loading: {
    variant: "loading",
    heading: "Verifying your email",
    description: "Please wait while we confirm your email address.",
  },
  success: {
    variant: "success",
    heading: "Email verified",
    description: "Your email address has been confirmed. You can now sign in to CollabSphere and continue.",
    action: { label: "Continue to sign in", href: "/login" },
  },
  expired: {
    variant: "expired",
    heading: "Verification link expired",
    description: "Verification links are valid for 24 hours. Go to sign in to request a new verification email.",
    action: {
      label: "Back to sign in",
      href: "/login",
    },
    secondaryAction: { label: "Back to sign in", href: "/login" },
  },
  "already-used": {
    variant: "success",
    heading: "Already verified",
    description:
      "This verification link has already been used. Your email may already be confirmed, so you can continue to sign in.",
    action: { label: "Continue to sign in", href: "/login" },
  },
  invalid: invalidCardConfig,
  "transient-error": {
    variant: "error",
    heading: "We couldn't reach the verification service",
    description: "Something went wrong on our end. Try again in a moment.",
  },
};

const resolveViewState = ({
  normalizedToken,
  isPending,
  isIdle,
  isSuccess,
  isError,
  errorCode,
}: {
  normalizedToken: string;
  isPending: boolean;
  isIdle: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorCode: string | null;
}): ViewState => {
  if (!normalizedToken) {
    return "missing";
  }

  if (isPending || isIdle) {
    return "loading";
  }

  if (isSuccess) {
    return "success";
  }

  if (!isError) {
    return "loading";
  }

  if (errorCode === "TOKEN_ALREADY_USED") {
    return "already-used";
  }

  if (errorCode === "TOKEN_EXPIRED") {
    return "expired";
  }

  if (errorCode === "TOKEN_INVALID" || errorCode === "VALIDATION_ERROR") {
    return "invalid";
  }

  return "transient-error";
};

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
      | { error?: { code?: string; message?: string } }
      | null;
    const code = body?.error?.code ?? "TOKEN_INVALID";
    const message = body?.error?.message ?? "Unable to verify email address.";
    throw new VerifyEmailApiError(code, response.status, message);
  }

  return response.json().catch(() => null);
};

export const VerifyEmailHandler = ({ token }: VerifyEmailHandlerProps) => {
  const normalizedToken = token.trim();
  const reduced = useReducedMotion();
  const hasTriggeredVerificationRef = useRef(false);
  const {
    error,
    isError,
    isIdle,
    isPending,
    isSuccess,
    mutate,
    reset,
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
    initial: reduced ? false : { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: reduced ? { opacity: 1 } : { opacity: 0, scale: 0.98 },
    transition,
  };

  const errorCode = error instanceof VerifyEmailApiError ? error.code : null;
  const viewState = resolveViewState({
    normalizedToken,
    isPending,
    isIdle,
    isSuccess,
    isError,
    errorCode,
  });
  const cardConfig = viewStateCardConfig[viewState];
  const activeAction = viewState === "transient-error"
    ? { label: "Try again", onClick: () => { reset(); mutate(normalizedToken); } }
    : cardConfig.action;

  return (
    <AnimatePresence mode="wait">
      <motion.div key={viewState} {...motionProps}>
        <AuthStatusCard
          variant={cardConfig.variant}
          heading={cardConfig.heading}
          description={cardConfig.description}
          action={activeAction}
          secondaryAction={cardConfig.secondaryAction}
        />
      </motion.div>
    </AnimatePresence>
  );
};
