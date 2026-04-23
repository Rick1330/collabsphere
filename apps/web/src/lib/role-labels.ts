/**
 * Workspace role-label mapping.
 *
 * Distinguishes **permission roles** (the canonical 5-tuple OWNER/ADMIN/
 * MANAGER/MEMBER/VIEWER) from **display labels** (what the UI shows the
 * user — "Tech Lead", "Stakeholder", "Advisor", "Student", etc.) which
 * vary by workspace type / template.
 *
 * Permission roles drive policy. Display labels drive UI text only.
 */

import type { WorkspaceRole } from "@/api/adapters/members";

export type WorkspaceTypeForLabels = "professional" | "academic" | "general";

/**
 * Default role-label map per workspace type. Workspaces can override
 * specific labels per-membership (the existing `roleLabel` field on
 * `WorkspaceMember`); when not overridden, this provides the truthful
 * default for the workspace type.
 */
const TYPE_LABEL_MAP: Record<WorkspaceTypeForLabels, Record<WorkspaceRole, string>> = {
  professional: {
    OWNER: "OWNER",
    ADMIN: "TECH LEAD",
    MANAGER: "PROJECT MANAGER",
    MEMBER: "MEMBER",
    VIEWER: "STAKEHOLDER",
  },
  academic: {
    OWNER: "INSTRUCTOR",
    ADMIN: "INSTRUCTOR",
    MANAGER: "ADVISOR",
    MEMBER: "STUDENT",
    VIEWER: "AUDITOR",
  },
  general: {
    OWNER: "OWNER",
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    MEMBER: "MEMBER",
    VIEWER: "VIEWER",
  },
};

export function getWorkspaceRoleLabel(
  workspaceType: WorkspaceTypeForLabels,
  role: WorkspaceRole,
): string {
  return TYPE_LABEL_MAP[workspaceType]?.[role] ?? role;
}

/**
 * Resolve the alias displayed in domain-specific contexts. The persona
 * "SUPERVISOR" is a domain alias; on the permission layer it maps to
 * MANAGER (academic workspaces) or ADMIN (research workspaces) and is
 * displayed as "Advisor" / "Reviewer" depending on the template.
 */
export function getSupervisorAlias(workspaceType: WorkspaceTypeForLabels): string {
  if (workspaceType === "academic") return "ADVISOR";
  return "REVIEWER";
}
