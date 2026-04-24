import {
  ERROR_CODES,
  ROLE_LEVELS,
  WORKSPACE_ROLES,
  type ErrorCode,
  type PrismaTransactionClient,
  type PrismaUser,
  type WorkspaceRole,
} from "@collabsphere/shared";

const workspaceRoles: readonly WorkspaceRole[] = WORKSPACE_ROLES;
const roleLevels: Record<WorkspaceRole, number> = ROLE_LEVELS;
const errorCodes: readonly ErrorCode[] = ERROR_CODES;
const sharedPrismaTypeSmokeCheck = null as PrismaUser | PrismaTransactionClient | null;

export const sharedContractsSmokeCheck = {
  errorCodes,
  roleLevels,
  sharedPrismaTypeSmokeCheck,
  workspaceRoles,
} as const;
