import { Link } from "react-router-dom";
import { ExternalLink, Users } from "lucide-react";
import { SettingsSection } from "@/features/settings/components/settings-section";

interface MembersTabProps {
  workspaceId: string;
  memberCount?: number;
}

export const MembersTab = ({ workspaceId, memberCount }: MembersTabProps) => {
  return (
    <SettingsSection title="Members" description="Manage workspace members and invitations.">
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-stone-200 bg-stone-50/40">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-stone-500" aria-hidden="true" />
            {memberCount ?? "..."} members
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage roles, invite new members, and review pending invitations.
          </p>
        </div>
        <Link
          to={`/w/${workspaceId}/members`}
          className="h-8 px-3 rounded-lg border border-stone-200 bg-white text-[12px] font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all duration-150 flex items-center gap-1.5 shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
          Manage members
        </Link>
      </div>
    </SettingsSection>
  );
};
