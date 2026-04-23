import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchMembers,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@/api/adapters/members";
import { cn } from "@/lib/utils";

interface TransferOwnershipDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  currentOwnerId: string;
  /** Called after a successful mock transfer with the new owner's user id. */
  onTransferred: (newOwnerId: string) => void;
}

/**
 * Transfer Ownership flow.
 * Steps:
 *  1. Pick eligible new owner (ADMIN or MANAGER members).
 *  2. Read consequences + type workspace name to confirm.
 *  3. Execute mock transfer; old owner becomes ADMIN.
 */
export const TransferOwnershipDialog = ({
  open,
  onClose,
  workspaceId,
  workspaceName,
  currentOwnerId,
  onTransferred,
}: TransferOwnershipDialogProps) => {
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedId(null);
      setTyped("");
      setSubmitting(false);
      setServerError(null);
    }
  }, [open]);

  const { data, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId, "members", "transfer-eligible"],
    queryFn: () => fetchMembers(workspaceId),
    enabled: open,
  });

  const ELIGIBLE_ROLES: WorkspaceRole[] = ["ADMIN", "MANAGER"];
  const eligible: WorkspaceMember[] = useMemo(
    () =>
      (data?.data.items ?? []).filter(
        (m) => m.user.id !== currentOwnerId && ELIGIBLE_ROLES.includes(m.role),
      ),
    [data, currentOwnerId],
  );

  const selectedMember = eligible.find((m) => m.user.id === selectedId);
  const matches = typed.trim() === workspaceName;

  const handleConfirm = async () => {
    if (!selectedMember || !matches) return;
    setSubmitting(true);
    setServerError(null);
    try {
      // Mock network round-trip — would call POST /workspaces/:id/transfer-ownership
      await new Promise((r) => setTimeout(r, 700));
      onTransferred(selectedMember.user.id);
      toast.success(
        `Ownership transferred to ${selectedMember.user.fullName}`,
        { description: "You are now an Admin of this workspace." },
      );
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Transfer failed. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-900">
            <ArrowRightLeft className="h-4 w-4 text-teal-600" />
            Transfer ownership
          </DialogTitle>
          <DialogDescription className="text-stone-500 leading-relaxed">
            {step === "select"
              ? "Select an Admin or Manager to become the new Owner. They will gain full control of this workspace."
              : `Transfer "${workspaceName}" to ${selectedMember?.user.fullName}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-3">
            {isLoading && (
              <p className="text-sm text-stone-500 py-6 text-center">
                Loading members…
              </p>
            )}
            {!isLoading && eligible.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-sm font-medium text-stone-900">
                  No eligible members
                </p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Promote a member to Admin or Manager first, then return here
                  to transfer ownership.
                </p>
              </div>
            )}
            {!isLoading && eligible.length > 0 && (
              <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                {eligible.map((m) => {
                  const isSelected = selectedId === m.user.id;
                  return (
                    <li key={m.user.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(m.user.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150",
                          isSelected
                            ? "bg-teal-50/60"
                            : "bg-white hover:bg-stone-50",
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-semibold text-stone-600 shrink-0">
                          {m.user.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">
                            {m.user.fullName}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            {m.user.email}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] tracking-wider uppercase text-stone-500 border border-stone-200 px-1.5 py-0.5 rounded">
                          {m.roleLabel}
                        </span>
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full border-2 shrink-0 transition-colors",
                            isSelected
                              ? "border-teal-600 bg-teal-600"
                              : "border-stone-300 bg-white",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {step === "confirm" && selectedMember && (
          <div className="space-y-4">
            <div className="rounded-lg border border-stone-200 bg-stone-50/40 p-4 space-y-2">
              <p className="text-[11px] font-mono tracking-[0.15em] uppercase text-stone-400">
                After transfer
              </p>
              <ul className="text-sm text-stone-700 space-y-1.5">
                <li>
                  • <span className="font-medium">{selectedMember.user.fullName}</span> becomes the Owner.
                </li>
                <li>
                  • You become an <span className="font-medium">Admin</span>.
                </li>
                <li>• Only the new Owner can delete or transfer again.</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-stone-600 mb-2">
                To confirm, type the workspace name{" "}
                <code className="font-mono text-[12px] bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-stone-900">
                  {workspaceName}
                </code>
              </p>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={workspaceName}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="w-full h-11 px-3.5 rounded-lg text-sm font-mono bg-white border border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
              />
            </div>
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
        )}

        <DialogFooter className="gap-2">
          {step === "select" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                disabled={!selectedId}
                className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                Continue
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {step === "confirm" && (
            <>
              <button
                type="button"
                onClick={() => setStep("select")}
                disabled={submitting}
                className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!matches || submitting}
                className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Transferring…
                  </>
                ) : (
                  "Transfer ownership"
                )}
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
