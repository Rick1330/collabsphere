import { SegmentLoading } from "../../components/foundation/segment-loading";

export default function PublicLoading() {
  return (
    <SegmentLoading
      label="Loading public route"
      detail="Preparing the public App Router context."
    />
  );
}
