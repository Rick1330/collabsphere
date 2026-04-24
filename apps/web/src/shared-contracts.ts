import { ERROR_CODES, ROLE_LEVELS, WORKSPACE_ROLES, type ErrorCode, type WorkspaceRole } from "@collabsphere/shared";

const workspaceRoles: readonly WorkspaceRole[] = WORKSPACE_ROLES;
const roleLevels: Record<WorkspaceRole, number> = ROLE_LEVELS;
const errorCodes: readonly ErrorCode[] = ERROR_CODES;

export const sharedContractsSmokeCheck = {
  errorCodes,
  roleLevels,
  workspaceRoles,
} as const;
