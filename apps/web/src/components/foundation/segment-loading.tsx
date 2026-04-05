type SegmentLoadingProps = {
  label: string;
  detail: string;
};

export function SegmentLoading({ label, detail }: Readonly<SegmentLoadingProps>) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}
