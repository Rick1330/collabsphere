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
  "REFRESH_TOKEN_TTL_DAYS",
  "CORS_ORIGINS",
  "EMAIL_PROVIDER_API_KEY",
  "EMAIL_SMTP_HOST",
  "EMAIL_SMTP_PORT",
  "API_BASE_URL",
  "BASE_URL",
]);

const apiBaseShape = {
  DATABASE_URL: true,
  REDIS_URL: true,
  JWT_ACCESS_SECRET: true,
  JWT_ACCESS_TTL_MINUTES: true,
  REFRESH_TOKEN_TTL_DAYS: true,
  CORS_ORIGINS: true,
  API_BASE_URL: true,
  BASE_URL: true,
};

const baseApiEnvSchema = sharedEnvSchema
  .pick(apiBaseShape)
  .extend({
    EMAIL_PROVIDER_API_KEY: createRequiredString("EMAIL_PROVIDER_API_KEY").optional(),
    EMAIL_SMTP_HOST: createRequiredString("EMAIL_SMTP_HOST").optional(),
    EMAIL_SMTP_PORT: createPositiveInteger("EMAIL_SMTP_PORT").optional(),
  })
  .strict();

export const apiEnvSchema = baseApiEnvSchema;

const hasConfiguredValue = (value) => typeof value === "string" && value.trim().length > 0;
const createApiEnvError = (key, message) => new EnvValidationError([{ key, message }]);
const missingSmtpPairMessage = "EMAIL_SMTP_HOST and EMAIL_SMTP_PORT must be set together for local SMTP.";
const missingProviderMessage = "EMAIL_PROVIDER_API_KEY is required when local SMTP is not configured.";

const createMissingPairError = (hasSmtpHost) =>
  createApiEnvError(
    hasSmtpHost ? "EMAIL_SMTP_PORT" : "EMAIL_SMTP_HOST",
    missingSmtpPairMessage,
  );

const createMissingProviderError = () => createApiEnvError("EMAIL_PROVIDER_API_KEY", missingProviderMessage);

const selectApiEnv = (input) =>
  Object.fromEntries(apiEnvKeys.map((key) => [key, input[key]]));

export const parseApiRuntimeEnv = (input) => {
  const selected = selectApiEnv(input);
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
