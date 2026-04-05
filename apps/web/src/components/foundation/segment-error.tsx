"use client";

import { useEffect } from "react";

type SegmentErrorProps = {
  label: string;
  detail: string;
  error: Error;
  reset: () => void;
};

export function SegmentError({
  label,
  detail,
  error,
  reset,
}: Readonly<SegmentErrorProps>) {
  useEffect(() => {
    console.error(`${label} segment error boundary caught an error.`, error);
  }, [error, label]);

  return (
    <section className="error-card">
      <p className="shell__eyebrow">Segment error boundary</p>
      <h2>{label}</h2>
      <p>{detail}</p>
      <button type="button" onClick={() => reset()}>
        Retry segment
      </button>
    </section>
  );
}
