import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  inviteMember,
  getAssignableRoles,
  getRoleLabel,
  getRoleDescription,
  type WorkspaceRole,
  type ApiError,
} from "@/api/adapters/members";

interface InviteDialogProps {
  workspaceId: string;
  currentUserRole: WorkspaceRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}

const inviteSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]),
});

type InviteValues = z.infer<typeof inviteSchema>;

export const InviteDialog = ({
  workspaceId,
  currentUserRole,
  open,
  onOpenChange,
  onInvited,
}: InviteDialogProps) => {
  const queryClient = useQueryClient();
  type AssignableRole = "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
  const assignable = getAssignableRoles(currentUserRole).filter(
    (r): r is AssignableRole => r !== "OWNER",
  );
  const defaultRole: AssignableRole = assignable.includes("MEMBER")
    ? "MEMBER"
    : assignable[0] ?? "MEMBER";

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: defaultRole },
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [lastInvitedEmail, setLastInvitedEmail] = useState("");

  const handleClose = (next: boolean) => {
    if (!next) {
      setServerError(null);
      setInviteSuccess(false);
      setLastInvitedEmail("");
      form.reset({ email: "", role: defaultRole });
    }
    onOpenChange(next);
  };

  const onSubmit = async (values: InviteValues) => {
    setServerError(null);
    setInviteSuccess(false);
    try {
      await inviteMember(workspaceId, {
        email: values.email.trim().toLowerCase(),
        role: values.role,
      });
      setLastInvitedEmail(values.email);
      setInviteSuccess(true);
      form.reset({ email: "", role: defaultRole });
      queryClient.invalidateQueries({
        queryKey: ["workspace", workspaceId, "invitations"],
      });
      onInvited();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.code === "EMAIL_ALREADY_MEMBER") {
        setServerError("This person is already a member of this workspace.");
      } else if (apiErr?.code === "INVITATION_ALREADY_PENDING") {
        setServerError("An invitation has already been sent to this email.");
      } else if (apiErr?.code === "INVITATION_RESEND_RATE_LIMITED") {
        setServerError("Invitation was resent recently. Try again in 24 hours.");
      } else if (apiErr?.code === "WORKSPACE_ARCHIVED") {
        setServerError("This workspace is archived. Restore it to invite members.");
      } else if (apiErr?.code === "WORKSPACE_MEMBER_LIMIT_REACHED") {
        setServerError("This workspace has reached the maximum member limit (50).");
      } else {
        setServerError("Failed to send invitation. Please try again.");
      }
    }
  };

  const watchedRole = form.watch("role");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="app-light max-w-md bg-white border-stone-200">
        <DialogHeader>
          <DialogTitle className="text-stone-900">Invite a member</DialogTitle>
          <DialogDescription className="text-stone-500">
            Send an invitation email to add someone to this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {inviteSuccess && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-2 text-sm text-emerald-700"
            >
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
              <span>
                Invitation sent to{" "}
                <span className="font-medium">{lastInvitedEmail}</span>
              </span>
            </div>
          )}

          <div>
            <label
              htmlFor="invite-email"
              className="text-sm font-medium text-stone-700 mb-1.5 block"
            >
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              autoFocus
              autoComplete="off"
              className="w-full h-11 px-3.5 rounded-lg text-sm bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-[13px] text-red-500 mt-1.5 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="invite-role"
              className="text-sm font-medium text-stone-700 mb-1.5 block"
            >
              Role
            </label>
            <select
              id="invite-role"
              className="w-full h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all duration-150"
              {...form.register("role")}
            >
              {assignable.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-400 mt-1.5">
              {getRoleDescription(watchedRole)}
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-sm text-red-700 flex items-start gap-2"
            >
              <AlertCircle
                className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{serverError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="h-9 px-4 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              {inviteSuccess ? "Done" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-1.5"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Send invitation
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
