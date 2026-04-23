import { useState } from "react";
import { Send, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface EditorSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  isResubmission: boolean;
  /** When false (e.g. empty doc), submission is blocked. */
  canSubmit: boolean;
  blockReason?: string;
  onConfirm: (note: string | undefined) => void;
}

export const EditorSubmitDialog = ({
  open,
  onOpenChange,
  documentTitle,
  isResubmission,
  canSubmit,
  blockReason,
  onConfirm,
}: EditorSubmitDialogProps) => {
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    onConfirm(note.trim() ? note.trim() : undefined);
    setNote("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setNote("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Send className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-900">
                {isResubmission ? "Resubmit for review" : "Submit for review"}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 mt-0.5">
                "{documentTitle}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!canSubmit ? (
          <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700 leading-relaxed">
              {blockReason ||
                "This document is empty. Add some content before submitting for review."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3 space-y-2">
                <p className="text-[12.5px] text-stone-700 leading-relaxed flex items-start gap-2">
                  <span className="font-mono text-[10px] text-stone-400 tracking-wider mt-0.5">
                    01
                  </span>
                  <span>
                    Document becomes <span className="font-semibold text-stone-900">read-only</span>{" "}
                    while a supervisor reviews it.
                  </span>
                </p>
                <p className="text-[12.5px] text-stone-700 leading-relaxed flex items-start gap-2">
                  <span className="font-mono text-[10px] text-stone-400 tracking-wider mt-0.5">
                    02
                  </span>
                  <span>Your supervisor will be notified.</span>
                </p>
                <p className="text-[12.5px] text-stone-700 leading-relaxed flex items-start gap-2">
                  <span className="font-mono text-[10px] text-stone-400 tracking-wider mt-0.5">
                    03
                  </span>
                  <span>You can still leave comments on the document.</span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="submit-note"
                  className="font-mono text-[10px] text-stone-500 tracking-[0.18em] uppercase"
                >
                  Note to reviewer{" "}
                  <span className="text-stone-400 normal-case tracking-normal font-sans">
                    (optional)
                  </span>
                </label>
                <Textarea
                  id="submit-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder={
                    isResubmission
                      ? "Briefly describe what changed since the last submission…"
                      : "Anything the reviewer should focus on?"
                  }
                  className="mt-1.5 text-[13px] resize-none"
                />
              </div>
            </div>
          </>
        )}

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {isResubmission ? "Resubmit" : "Submit for review"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
