import { SegmentLoading } from "../../components/shared/segment-loading";

export default function AuthenticatedLoading() {
  return (
    <SegmentLoading
      label="Loading authenticated route"
      detail="Preparing the authenticated global shell foundation."
    />
  );
}
