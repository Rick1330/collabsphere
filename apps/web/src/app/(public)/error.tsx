"use client";

import { SegmentError } from "../../components/shared/segment-error";

type PublicErrorProps = {
  error: Error;
  reset: () => void;
};

export default function PublicError({ error, reset }: Readonly<PublicErrorProps>) {
  return (
    <SegmentError
      label="Public route fallback"
      detail="The public route shell hit an unexpected problem. Retry when ready."
      error={error}
      reset={reset}
    />
  );
}
