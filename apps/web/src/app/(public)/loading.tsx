import { SegmentLoading } from "../../components/shared/segment-loading";

export default function PublicLoading() {
  return (
    <SegmentLoading
      label="Loading public route"
      detail="Preparing the public App Router context."
    />
  );
}
