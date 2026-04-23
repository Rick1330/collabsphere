import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText: string;
  confirmLabel: string;
  variant: "warning" | "destructive";
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmLabel,
  variant,
}: ConfirmDialogProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setInputValue("");
      setServerError(null);
      setIsLoading(false);
    }
  }, [open]);

  const matches = inputValue === confirmText;

  const handleConfirm = async () => {
    if (!matches) return;
    setIsLoading(true);
    setServerError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmClasses =
    variant === "destructive"
      ? "bg-red-600 hover:bg-red-500 text-white"
      : "bg-amber-600 hover:bg-amber-500 text-white";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isLoading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight text-stone-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-stone-500 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-stone-600">
            To confirm, type{" "}
            <code className="font-mono text-[12px] bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-stone-900">
              {confirmText}
            </code>{" "}
            below:
          </p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setServerError(null);
            }}
            placeholder={confirmText}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="w-full h-11 px-3.5 rounded-lg text-sm font-mono bg-white border border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
          />
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-1.5 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!matches || isLoading}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed",
              confirmClasses,
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
