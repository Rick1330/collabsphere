import { Button } from "@collabsphere/ui/components/button";

type SectionErrorProps = {
  title: string;
  message: string;
  requestId?: string | null;
  onRetry?: () => void;
};

export function SectionError({
  message,
  onRetry,
  requestId,
  title,
}: Readonly<SectionErrorProps>) {
  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50/80 p-5 text-red-900 shadow-sm"
      role="alert"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-red-800/80">{message}</p>
      {requestId ? <p className="mt-2 font-mono text-[11px] text-red-700">Request ID: {requestId}</p> : null}
      {onRetry ? (
        <Button className="mt-4" size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

