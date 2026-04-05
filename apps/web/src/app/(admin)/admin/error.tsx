"use client";

import { SegmentError } from "../../../components/foundation/segment-error";

type AdminErrorProps = {
  error: Error;
  reset: () => void;
};

export default function AdminError({ error, reset }: Readonly<AdminErrorProps>) {
  return (
    <SegmentError
      label="Admin route fallback"
      detail="The admin route shell hit an unexpected problem. Retry when ready."
      error={error}
      reset={reset}
    />
  );
}
