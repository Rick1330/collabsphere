export default function Loading() {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div>
        <strong>Loading route foundation…</strong>
        <p>The App Router shell is resolving the next segment.</p>
      </div>
    </div>
  );
}

