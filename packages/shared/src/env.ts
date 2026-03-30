import {
  envRedaction,
  type SanitizedSharedEnv,
  type SharedEnv,
} from "./env.schema.js";
import { parseRuntimeEnv } from "./runtime-env.js";

export type { SanitizedSharedEnv, SharedEnv } from "./env.schema.js";
export {
  declaredEnvKeys,
  envRedaction,
  optionalEnvKeys,
  requiredEnvKeys,
  sharedEnvSchema,
} from "./env.schema.js";
export type { ApiRuntimeEnv } from "./api-env.js";
export { apiEnvKeys, apiEnvSchema, parseApiRuntimeEnv } from "./api-env.js";
export { parseRuntimeEnv } from "./runtime-env.js";
export { EnvValidationError, formatEnvValidationIssues } from "./env-core.js";

export interface EnvValidationIssue {
  key: string;
  message: string;
}

const redactUrlCredentials = (value: string) => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    return value;
  }

  const hasCredentials = Boolean(parsedUrl.username || parsedUrl.password);
  const authority = hasCredentials ? `[redacted]@${parsedUrl.host}` : parsedUrl.host;
  return `${parsedUrl.protocol}//${authority}${parsedUrl.pathname}`;
};

export const parseEnv = (input: Record<string, string | undefined>): SanitizedSharedEnv =>
  sanitizeEnv(parseRuntimeEnv(input));

export const sanitizeEnv = (config: SharedEnv): SanitizedSharedEnv => {
  const credentialConfig = config as {
    DATABASE_URL: string;
    REDIS_URL: string;
    COLLAB_DATABASE_URL: string;
    COLLAB_REDIS_URL?: string;
  };

  return {
    ...config,
    DATABASE_URL: redactUrlCredentials(credentialConfig.DATABASE_URL),
    REDIS_URL: redactUrlCredentials(credentialConfig.REDIS_URL),
    JWT_ACCESS_SECRET: envRedaction.redactedValue,
    EMAIL_PROVIDER_API_KEY: envRedaction.redactedValue,
    COLLAB_DATABASE_URL: redactUrlCredentials(credentialConfig.COLLAB_DATABASE_URL),
    COLLAB_REDIS_URL: credentialConfig.COLLAB_REDIS_URL
      ? redactUrlCredentials(credentialConfig.COLLAB_REDIS_URL)
      : undefined,
    COLLAB_JWT_SECRET: envRedaction.redactedValue,
    S3_ACCESS_KEY_ID: envRedaction.redactedValue,
    S3_SECRET_ACCESS_KEY: envRedaction.redactedValue,
  };
};
