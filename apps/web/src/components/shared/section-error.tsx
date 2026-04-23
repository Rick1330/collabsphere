import { AlertCircle, RefreshCw } from "lucide-react";

interface SectionErrorProps {
  sectionName: string;
  requestId?: string;
  onRetry: () => void;
}

export const SectionError = ({ sectionName, requestId, onRetry }: SectionErrorProps) => (
  <div role="alert" className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center">
    <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
    <p className="text-sm text-stone-700 mt-2 font-medium">Couldn't load {sectionName}</p>
    {requestId && (
      <p className="text-xs text-stone-500 mt-1 font-mono">Request ID: {requestId}</p>
    )}
    <button
      onClick={onRetry}
      className="mt-3 h-8 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700
        hover:bg-stone-50 transition-colors flex items-center gap-2 mx-auto
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Try again
    </button>
  </div>
);
