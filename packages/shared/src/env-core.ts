import { z, type ZodError } from "zod";

export interface EnvValidationIssue {
  key: string;
  message: string;
}

const positiveIntegerPattern = /^\d+$/;
const corsOriginProtocols = ["http:", "https:"] as const;

const issueMessageByCode = (issue: { message?: string }) => issue.message || "is invalid.";

const toValidationIssue = (issue: {
  message?: string;
  path: readonly PropertyKey[];
}): EnvValidationIssue => ({
  key: String(issue.path[0] ?? "env"),
  message: issueMessageByCode(issue),
});

const formatValidationMessage = (issues: readonly EnvValidationIssue[]) => {
  const detail = issues.map((issue) => `${issue.key}: ${issue.message}`).join("; ");
  return `Environment validation failed. Review .env.example and fix: ${detail}`;
};

export class EnvValidationError extends Error {
  readonly issues: readonly EnvValidationIssue[];

  constructor(issues: readonly EnvValidationIssue[]) {
    super(formatValidationMessage(issues));
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

export const formatEnvValidationIssues = (
  error: ZodError | EnvValidationError,
): EnvValidationIssue[] => {
  if (error instanceof EnvValidationError) {
    return [...error.issues];
  }

  return error.issues.map(toValidationIssue);
};

export const createRequiredString = (key: string) =>
  z
    .string({
      error: `${key} is required.`,
    })
    .trim()
    .min(1, `${key} is required.`);

export const createAbsoluteUrl = (key: string, protocols?: readonly string[]) =>
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

export const createOptionalAbsoluteUrl = (key: string, protocols?: readonly string[]) =>
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

export const createPositiveInteger = (key: string) =>
  createRequiredString(key)
    .refine((value) => positiveIntegerPattern.test(value), {
      message: `${key} must be a positive integer.`,
    })
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => Number.isInteger(value) && value > 0, {
      message: `${key} must be a positive integer.`,
    });

const isBareOrigin = (value: URL) =>
  !value.username &&
  !value.password &&
  value.pathname === "/" &&
  !value.search &&
  !value.hash;

export const createCorsOrigins = () =>
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
          message: "CORS_ORIGINS must include at least one absolute origin.",
        });
        return;
      }

      for (const [index, origin] of origins.entries()) {
        try {
          const parsedUrl = new URL(origin);
          if (!corsOriginProtocols.includes(parsedUrl.protocol as (typeof corsOriginProtocols)[number])) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `CORS_ORIGINS entry ${index + 1} must use http: or https:.`,
            });
            continue;
          }

          if (!isBareOrigin(parsedUrl)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                `CORS_ORIGINS entry ${index + 1} must be a bare origin (scheme, host, optional port).`,
            });
          }
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `CORS_ORIGINS entry ${index + 1} must be a valid absolute origin.`,
          });
        }
      }
    })
    .transform((origins) => origins.map((origin) => new URL(origin).origin));
