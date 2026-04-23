import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  ArchiveRestore,
  ArrowRightLeft,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";
import { workspaceStore, type StoredWorkspaceStatus } from "@/features/workspace/store/workspace-store";

interface DangerTabProps {
  workspaceId: string;
  workspace: {
    name: string;
    status: StoredWorkspaceStatus;
    permissions: { canArchive: boolean; canDelete: boolean };
  };
  onChanged: () => void;
}

type ConfirmAction = "archive" | "unarchive" | "delete" | null;

interface DangerActionRowProps {
  tone: "amber" | "teal" | "red";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  consequences: string[];
  buttonLabel: string;
  buttonIcon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

const toneClasses: Record<
  DangerActionRowProps["tone"],
  { wrap: string; eyebrow: string; button: string; iconWrap: string; iconColor: string }
> = {
  amber: {
    wrap: "border-amber-200/70 bg-gradient-to-r from-amber-50/40 to-white",
    eyebrow: "text-amber-700",
    button:
      "border-amber-300 text-amber-800 hover:bg-amber-50",
    iconWrap: "bg-amber-100/70 border-amber-200",
    iconColor: "text-amber-600",
  },
  teal: {
    wrap: "border-teal-200/70 bg-gradient-to-r from-teal-50/40 to-white",
    eyebrow: "text-teal-700",
    button:
      "border-teal-300 text-teal-800 hover:bg-teal-50",
    iconWrap: "bg-teal-100/70 border-teal-200",
    iconColor: "text-teal-700",
  },
  red: {
    wrap: "border-red-200 bg-gradient-to-r from-red-50/40 to-white",
    eyebrow: "text-red-700",
    button:
      "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800",
    iconWrap: "bg-red-100/70 border-red-200",
    iconColor: "text-red-600",
  },
};

const DangerActionRow = ({
  tone,
  icon: Icon,
  title,
  description,
  consequences,
  buttonLabel,
  buttonIcon: BtnIcon,
  onClick,
}: DangerActionRowProps) => {
  const c = toneClasses[tone];
  return (
    <div
      className={cn(
        "rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-5",
        c.wrap,
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0",
          c.iconWrap,
        )}
        aria-hidden="true"
      >
        <Icon className={cn("h-5 w-5", c.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        <p className="text-[13px] text-stone-600 mt-1 leading-relaxed">{description}</p>
        <ul className="mt-3 space-y-1 text-[12px] text-stone-500">
          {consequences.map((line) => (
            <li key={line} className="flex items-start gap-1.5">
              <span aria-hidden="true" className="mt-1 h-1 w-1 rounded-full bg-stone-400" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "h-9 px-3.5 rounded-lg border bg-white text-[12.5px] font-medium transition-colors flex items-center gap-1.5 self-start sm:self-center flex-shrink-0",
          c.button,
        )}
      >
        <BtnIcon className="h-3.5 w-3.5" />
        {buttonLabel}
      </button>
    </div>
  );
};

export const DangerTab = ({ workspaceId, workspace, onChanged }: DangerTabProps) => {
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const isArchived = workspace.status === "archived";

  const closeConfirm = () => setConfirmAction(null);

  const noActions =
    !workspace.permissions.canDelete && !workspace.permissions.canArchive;

  return (
    <section className="space-y-5">
      {/* Heavy framing */}
      <header className="rounded-xl border border-red-200 bg-gradient-to-b from-red-50/60 to-red-50/10 p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-white border border-red-200 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="h-5 w-5 text-red-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-red-700">
            Danger zone
          </p>
          <h2 className="text-base font-semibold text-stone-900 mt-1.5">
            Irreversible & destructive actions
          </h2>
          <p className="text-[13px] text-stone-600 mt-1.5 leading-relaxed">
            These actions affect every member of <span className="font-medium text-stone-900">{workspace.name}</span>.
            Read each consequence list carefully — none of these undo themselves.
          </p>
        </div>
      </header>

      {workspace.permissions.canArchive && (
        <DangerActionRow
          tone="amber"
          icon={isArchived ? ArchiveRestore : Archive}
          title={isArchived ? "Unarchive workspace" : "Archive workspace"}
          description={
            isArchived
              ? "Restore this workspace so members can create and edit content again."
              : "Make the workspace read-only. Existing content stays put."
          }
          consequences={
            isArchived
              ? [
                  "Members regain create / edit permissions",
                  "Workspace re-appears in active filters",
                ]
              : [
                  "All members lose create / edit / delete permissions",
                  "No new documents, tasks, or invitations can be issued",
                  "Existing content remains visible and exportable",
                ]
          }
          buttonLabel={isArchived ? "Unarchive" : "Archive"}
          buttonIcon={isArchived ? ArchiveRestore : Archive}
          onClick={() => setConfirmAction(isArchived ? "unarchive" : "archive")}
        />
      )}

      {workspace.permissions.canDelete && (
        <DangerActionRow
          tone="teal"
          icon={ArrowRightLeft}
          title="Transfer ownership"
          description="Hand over Owner status to another Admin or Manager. Ownership grants final say on deletion and ownership transfers."
          consequences={[
            "Selected member becomes Owner with full control",
            "You will be downgraded to Admin",
            "Only the new Owner can delete or transfer again",
          ]}
          buttonLabel="Transfer"
          buttonIcon={ArrowRightLeft}
          onClick={() => setTransferOpen(true)}
        />
      )}

      {workspace.permissions.canDelete && (
        <DangerActionRow
          tone="red"
          icon={Trash2}
          title="Delete workspace"
          description="Permanently remove this workspace and everything inside it."
          consequences={[
            "Removes all documents, tasks, comments, and member records",
            "Members immediately lose access",
            "Recoverable for 90 days via support — after that it is gone",
          ]}
          buttonLabel="Delete workspace"
          buttonIcon={Trash2}
          onClick={() => setConfirmAction("delete")}
        />
      )}

      {noActions && (
        <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-6 text-center">
          <p className="text-sm text-stone-500">
            Only the workspace Owner can perform these actions.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "archive"}
        onClose={closeConfirm}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 400));
          workspaceStore.setStatus(workspaceId, "archived");
          toast.success(`"${workspace.name}" archived`);
          onChanged();
        }}
        title="Archive workspace"
        description={`Are you sure you want to archive "${workspace.name}"? The workspace will become read-only for all members.`}
        confirmText={workspace.name}
        confirmLabel="Archive workspace"
        variant="warning"
      />
      <ConfirmDialog
        open={confirmAction === "unarchive"}
        onClose={closeConfirm}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 400));
          workspaceStore.setStatus(workspaceId, "active");
          toast.success(`"${workspace.name}" unarchived`);
          onChanged();
        }}
        title="Unarchive workspace"
        description={`Restore "${workspace.name}" to active status?`}
        confirmText={workspace.name}
        confirmLabel="Unarchive workspace"
        variant="warning"
      />
      <ConfirmDialog
        open={confirmAction === "delete"}
        onClose={closeConfirm}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 500));
          workspaceStore.remove(workspaceId);
          toast.success("Workspace deleted. It can be restored within 90 days.");
          navigate("/workspaces");
        }}
        title="Delete workspace"
        description={`This will permanently delete "${workspace.name}" and all its documents, tasks, and files. This action cannot be undone.`}
        confirmText={workspace.name}
        confirmLabel="Delete workspace permanently"
        variant="destructive"
      />

      <TransferOwnershipDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        workspaceId={workspaceId}
        workspaceName={workspace.name}
        currentOwnerId="user-jane"
        onTransferred={() => {
          onChanged();
        }}
      />
    </section>
  );
};
