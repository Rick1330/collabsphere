"use client";

import { SegmentError } from "../../../../components/foundation/segment-error";

type WorkspaceErrorProps = {
  error: Error;
  reset: () => void;
};

export default function WorkspaceError({
  error,
  reset,
}: Readonly<WorkspaceErrorProps>) {
  return (
    <SegmentError
      label="Workspace route fallback"
      detail="The workspace route shell hit an unexpected problem. Retry when ready."
      error={error}
      reset={reset}
    />
  );
}
