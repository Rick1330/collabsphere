import { SegmentLoading } from "../../../../components/shared/segment-loading";

export default function WorkspaceLoading() {
  return (
    <SegmentLoading
      label="Loading workspace route"
      detail="Preparing the workspace route foundation for the selected workspace."
    />
  );
}
