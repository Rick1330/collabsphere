import {
  APP_SERVICES,
  ERROR_CODES,
  type AppService,
  type ErrorCode,
  type PrismaTransactionClient,
  type PrismaUser,
} from "@collabsphere/shared";

const appServices: readonly AppService[] = APP_SERVICES;
const errorCodes: readonly ErrorCode[] = ERROR_CODES;
const sharedPrismaTypeSmokeCheck = null as PrismaUser | PrismaTransactionClient | null;

export const sharedContractsSmokeCheck = {
  appServices,
  errorCodes,
  sharedPrismaTypeSmokeCheck,
} as const;
