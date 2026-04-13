"use client";

import { SegmentError } from "../../components/shared/segment-error";

type AuthenticatedErrorProps = {
  error: Error;
  reset: () => void;
};

export default function AuthenticatedError({
  error,
  reset,
}: Readonly<AuthenticatedErrorProps>) {
  return (
    <SegmentError
      label="Authenticated route fallback"
      detail="The authenticated route shell hit an unexpected problem. Retry when ready."
      error={error}
      reset={reset}
    />
  );
}
