import { z } from "zod";

const positiveIntegerPattern = /^\d+$/;
const redactedValue = "[redacted]" as const;

const secretEnvKeys = [
  "JWT_ACCESS_SECRET",
  "EMAIL_PROVIDER_API_KEY",
  "COLLAB_JWT_SECRET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

const credentialUrlEnvKeys = [
  "DATABASE_URL",
  "REDIS_URL",
  "COLLAB_DATABASE_URL",
  "COLLAB_REDIS_URL",
] as const;

export const requiredEnvKeys = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_TTL_MINUTES",
  "REFRESH_TOKEN_TTL_DAYS",
  "CORS_ORIGINS",
  "EMAIL_PROVIDER_API_KEY",
  "API_BASE_URL",
  "BASE_URL",
  "COLLAB_DATABASE_URL",
  "COLLAB_JWT_SECRET",
  "COLLAB_WS_URL",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_REGION",
] as const;

export const optionalEnvKeys = [
  "COLLAB_REDIS_URL",
  "S3_ENDPOINT",
] as const;

export type SecretEnvKey = (typeof secretEnvKeys)[number];
export type CredentialUrlEnvKey = (typeof credentialUrlEnvKeys)[number];
export type RequiredEnvKey = (typeof requiredEnvKeys)[number];
export type OptionalEnvKey = (typeof optionalEnvKeys)[number];

const createRequiredString = (key: string) =>
  z
    .string({
      error: `${key} is required.`,
    })
    .trim()
    .min(1, `${key} is required.`);

const createAbsoluteUrl = (key: string, protocols?: readonly string[]) =>
  createRequiredString(key).superRefine((value, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must be a valid absolute URL.`,
      });
      return;
    }

    if (protocols && !protocols.includes(parsedUrl.protocol)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must use one of: ${protocols.join(", ")}.`,
      });
    }
  });

const createOptionalAbsoluteUrl = (key: string, protocols?: readonly string[]) =>
  z
    .string()
    .trim()
    .min(1, `${key} must not be empty when provided.`)
    .superRefine((value, context) => {
      let parsedUrl: URL;

      try {
        parsedUrl = new URL(value);
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must be a valid absolute URL.`,
        });
        return;
      }

      if (protocols && !protocols.includes(parsedUrl.protocol)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must use one of: ${protocols.join(", ")}.`,
        });
      }
    })
    .optional();

const createPositiveInteger = (key: string) =>
  createRequiredString(key)
    .refine((value) => positiveIntegerPattern.test(value), {
      message: `${key} must be a positive integer.`,
    })
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => Number.isInteger(value) && value > 0, {
      message: `${key} must be a positive integer.`,
    });

const createCorsOrigins = () =>
  createRequiredString("CORS_ORIGINS")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .superRefine((origins, context) => {
      if (origins.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CORS_ORIGINS must include at least one absolute URL.",
        });
        return;
      }

      for (const origin of origins) {
        try {
          const parsedUrl = new URL(origin);
          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `CORS_ORIGINS entries must use http: or https: (${origin}).`,
            });
          }
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `CORS_ORIGINS entries must be valid absolute URLs (${origin}).`,
          });
        }
      }
    });

export const sharedEnvSchema = z
  .object({
    DATABASE_URL: createAbsoluteUrl("DATABASE_URL"),
    REDIS_URL: createAbsoluteUrl("REDIS_URL"),
    JWT_ACCESS_SECRET: createRequiredString("JWT_ACCESS_SECRET"),
    JWT_ACCESS_TTL_MINUTES: createPositiveInteger("JWT_ACCESS_TTL_MINUTES"),
    REFRESH_TOKEN_TTL_DAYS: createPositiveInteger("REFRESH_TOKEN_TTL_DAYS"),
    CORS_ORIGINS: createCorsOrigins(),
    EMAIL_PROVIDER_API_KEY: createRequiredString("EMAIL_PROVIDER_API_KEY"),
    API_BASE_URL: createAbsoluteUrl("API_BASE_URL"),
    BASE_URL: createAbsoluteUrl("BASE_URL"),
    COLLAB_DATABASE_URL: createAbsoluteUrl("COLLAB_DATABASE_URL"),
    COLLAB_REDIS_URL: createOptionalAbsoluteUrl("COLLAB_REDIS_URL"),
    COLLAB_JWT_SECRET: createRequiredString("COLLAB_JWT_SECRET"),
    COLLAB_WS_URL: createAbsoluteUrl("COLLAB_WS_URL", ["ws:", "wss:"]),
    S3_ENDPOINT: createOptionalAbsoluteUrl("S3_ENDPOINT"),
    S3_BUCKET: createRequiredString("S3_BUCKET"),
    S3_ACCESS_KEY_ID: createRequiredString("S3_ACCESS_KEY_ID"),
    S3_SECRET_ACCESS_KEY: createRequiredString("S3_SECRET_ACCESS_KEY"),
    S3_REGION: createRequiredString("S3_REGION"),
  })
  .strict();

export type SharedEnv = z.infer<typeof sharedEnvSchema>;

export type SanitizedSharedEnv = Omit<SharedEnv, SecretEnvKey | CredentialUrlEnvKey> &
  Record<SecretEnvKey, typeof redactedValue> &
  {
    DATABASE_URL: string;
    REDIS_URL: string;
    COLLAB_DATABASE_URL: string;
    COLLAB_REDIS_URL?: string;
  };

export const envRedaction = Object.freeze({
  redactedValue,
  secretEnvKeys,
  credentialUrlEnvKeys,
});
