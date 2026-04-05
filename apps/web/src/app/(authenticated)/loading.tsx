import { SegmentLoading } from "../../components/foundation/segment-loading";

export default function AuthenticatedLoading() {
  return (
    <SegmentLoading
      label="Loading authenticated route"
      detail="Preparing the authenticated global shell foundation."
    />
  );
}
