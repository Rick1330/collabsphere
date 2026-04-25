import type { z } from "zod";
import {
  EnvValidationError,
  sharedEnvSchema,
} from "./runtime-env.js";
import {
  createPositiveInteger,
  createRequiredString,
  formatEnvValidationIssues,
} from "./env-core.js";

export { EnvValidationError } from "./runtime-env.js";

export const apiEnvKeys = Object.freeze([
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_TTL_MINUTES",
  "BCRYPT_COST",
  "REFRESH_TOKEN_TTL_DAYS",
  "CORS_ORIGINS",
  "EMAIL_PROVIDER_API_KEY",
  "EMAIL_SMTP_HOST",
  "EMAIL_SMTP_PORT",
  "API_BASE_URL",
  "BASE_URL",
] as const);

export type ApiEnvKey = (typeof apiEnvKeys)[number];

const apiBaseShape = {
  DATABASE_URL: true,
  REDIS_URL: true,
  JWT_ACCESS_SECRET: true,
  JWT_ACCESS_TTL_MINUTES: true,
  REFRESH_TOKEN_TTL_DAYS: true,
  CORS_ORIGINS: true,
  API_BASE_URL: true,
  BASE_URL: true,
} as const;

const baseApiEnvSchema = sharedEnvSchema
  .pick(apiBaseShape)
  .extend({
    BCRYPT_COST: createPositiveInteger("BCRYPT_COST").refine((value) => value >= 10 && value <= 15, {
      message: "BCRYPT_COST must be between 10 and 15.",
    }),
    EMAIL_PROVIDER_API_KEY: createRequiredString("EMAIL_PROVIDER_API_KEY").optional(),
    EMAIL_SMTP_HOST: createRequiredString("EMAIL_SMTP_HOST").optional(),
    EMAIL_SMTP_PORT: createPositiveInteger("EMAIL_SMTP_PORT").optional(),
  })
  .strict();

export interface ApiRuntimeEnv extends z.infer<typeof baseApiEnvSchema> {}

export const apiEnvSchema: z.ZodType<ApiRuntimeEnv> = baseApiEnvSchema;

const hasConfiguredValue = (value: string | number | undefined): value is string | number =>
  typeof value === "number" || (typeof value === "string" && value.trim().length > 0);

const createApiEnvError = (key: ApiEnvKey, message: string) =>
  new EnvValidationError([{ key, message }]);

const missingSmtpPairMessage =
  "EMAIL_SMTP_HOST and EMAIL_SMTP_PORT must be set together for local SMTP.";
const missingProviderMessage =
  "EMAIL_PROVIDER_API_KEY is required when local SMTP is not configured.";

const createMissingPairError = (hasSmtpHost: boolean) =>
  createApiEnvError(
    hasSmtpHost ? "EMAIL_SMTP_PORT" : "EMAIL_SMTP_HOST",
    missingSmtpPairMessage,
  );

const createMissingProviderError = () =>
  createApiEnvError("EMAIL_PROVIDER_API_KEY", missingProviderMessage);

const selectApiEnv = (input: Record<string, string | undefined>) =>
  Object.fromEntries(apiEnvKeys.map((key) => [key, input[key]])) as Record<
    ApiEnvKey,
    string | undefined
  >;

const normalizeOptionalEmailValue = (value: string | undefined) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().length > 0 ? value : undefined;
};

const normalizeOptionalEmailFields = (selected: Record<ApiEnvKey, string | undefined>) => ({
  ...selected,
  BCRYPT_COST: normalizeOptionalEmailValue(selected.BCRYPT_COST) ?? "12",
  EMAIL_PROVIDER_API_KEY: normalizeOptionalEmailValue(selected.EMAIL_PROVIDER_API_KEY),
  EMAIL_SMTP_HOST: normalizeOptionalEmailValue(selected.EMAIL_SMTP_HOST),
  EMAIL_SMTP_PORT: normalizeOptionalEmailValue(selected.EMAIL_SMTP_PORT),
});

export const parseApiRuntimeEnv = (input: Record<string, string | undefined>): ApiRuntimeEnv => {
  const selected = normalizeOptionalEmailFields(selectApiEnv(input));
  const hasSmtpHost = hasConfiguredValue(selected.EMAIL_SMTP_HOST);
  const hasSmtpPort = hasConfiguredValue(selected.EMAIL_SMTP_PORT);
  const hasProvider = hasConfiguredValue(selected.EMAIL_PROVIDER_API_KEY);

  if (hasSmtpHost !== hasSmtpPort) {
    throw createMissingPairError(hasSmtpHost);
  }

  if (!hasSmtpHost && !hasProvider) {
    throw createMissingProviderError();
  }

  const parsed = apiEnvSchema.safeParse(selected);

  if (!parsed.success) {
    throw new EnvValidationError(formatEnvValidationIssues(parsed.error));
  }

  return parsed.data;
};
