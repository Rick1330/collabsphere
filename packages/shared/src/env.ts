import { ZodError } from "zod";

import {
  apiEnvKeys,
  apiEnvSchema,
  declaredEnvKeys,
  envRedaction,
  type ApiRuntimeEnv,
  sharedEnvSchema,
  type SanitizedSharedEnv,
  type SharedEnv,
} from "./env.schema.js";
import { EnvValidationError, formatEnvValidationIssues } from "./env-core.js";

export type { ApiRuntimeEnv, SanitizedSharedEnv, SharedEnv } from "./env.schema.js";
export {
  apiEnvKeys,
  apiEnvSchema,
  declaredEnvKeys,
  envRedaction,
  optionalEnvKeys,
  requiredEnvKeys,
  sharedEnvSchema,
} from "./env.schema.js";
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

const selectEnvSubset = <TKey extends string>(
  input: Record<string, string | undefined>,
  keys: readonly TKey[],
) =>
  Object.fromEntries(
    keys.map((key) => [key, input[key]]),
  ) as Record<TKey, string | undefined>;

const parseScopedRuntimeEnv = <TEnv>(
  input: Record<string, string | undefined>,
  keys: readonly string[],
  schema: {
    safeParse: (
      value: Record<string, string | undefined>,
    ) =>
      | { success: true; data: TEnv }
      | { success: false; error: unknown };
  },
): TEnv => {
  const parsed = schema.safeParse(selectEnvSubset(input, keys));

  if (!parsed.success) {
    throw new EnvValidationError(
      formatEnvValidationIssues(parsed.error as InstanceType<typeof ZodError>),
    );
  }

  return parsed.data;
};

export const parseRuntimeEnv = (input: Record<string, string | undefined>): SharedEnv => {
  return parseScopedRuntimeEnv(input, declaredEnvKeys, sharedEnvSchema);
};

export const parseApiRuntimeEnv = (
  input: Record<string, string | undefined>,
): ApiRuntimeEnv => parseScopedRuntimeEnv(input, apiEnvKeys, apiEnvSchema);

export const parseEnv = (input: Record<string, string | undefined>): SanitizedSharedEnv =>
  sanitizeEnv(parseRuntimeEnv(input));

export const sanitizeEnv = (config: SharedEnv): SanitizedSharedEnv => {
  const values = config as Record<string, unknown>;

  return {
  ...config,
  DATABASE_URL: redactUrlCredentials(String(values.DATABASE_URL)),
  REDIS_URL: redactUrlCredentials(String(values.REDIS_URL)),
  JWT_ACCESS_SECRET: envRedaction.redactedValue,
  EMAIL_PROVIDER_API_KEY: envRedaction.redactedValue,
  COLLAB_DATABASE_URL: redactUrlCredentials(String(values.COLLAB_DATABASE_URL)),
  COLLAB_REDIS_URL: values.COLLAB_REDIS_URL
    ? redactUrlCredentials(String(values.COLLAB_REDIS_URL))
    : undefined,
  COLLAB_JWT_SECRET: envRedaction.redactedValue,
  S3_ACCESS_KEY_ID: envRedaction.redactedValue,
  S3_SECRET_ACCESS_KEY: envRedaction.redactedValue,
  };
};
