import { AlertTriangle, Shield, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { DocumentVersion } from "@/api/adapters/documents";

interface RestoreConfirmDialogProps {
  open: boolean;
  version: DocumentVersion | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const RestoreConfirmDialog = ({
  open,
  version,
  onCancel,
  onConfirm,
}: RestoreConfirmDialogProps) => {
  if (!version) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-stone-900 flex items-center gap-2">
            <RotateIcon /> Restore version #{version.versionNumber}?
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            The current document will be replaced with this version's content.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-amber-900">
              A safety snapshot is created first
            </p>
            <p className="text-[12px] text-amber-700 mt-1 leading-snug">
              We'll capture the current state as a new version (reason:{" "}
              <span className="font-mono">before_restore</span>) so you can
              undo this restore at any time.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-sm font-semibold text-white transition-colors"
          >
            Restore version
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RotateIcon = () => (
  <span className="h-7 w-7 rounded-md bg-stone-100 border border-stone-200 inline-flex items-center justify-center">
    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
  </span>
);
