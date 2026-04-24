import { APP_SERVICES, ERROR_CODES, type AppService, type ErrorCode } from "@collabsphere/shared";

const appServices: readonly AppService[] = APP_SERVICES;
const errorCodes: readonly ErrorCode[] = ERROR_CODES;

export const sharedContractsSmokeCheck = {
  appServices,
  errorCodes,
} as const;
