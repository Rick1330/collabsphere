const hasValue = (value: string | undefined): value is string => typeof value === "string" && value.trim().length > 0;
const hasPortValue = (value: number | undefined): value is number => typeof value === "number";
type EmailConfigInput = {
  EMAIL_PROVIDER_API_KEY?: string;
  EMAIL_SMTP_HOST?: string;
  EMAIL_SMTP_PORT?: string | number;
};

const assertDigitsOnly = (value: string) => {
  if (!/^\d+$/.test(value)) {
    throw new Error("EMAIL_SMTP_PORT must be a positive integer when local SMTP is configured.");
  }
};

const assertPositiveInteger = (value: number) => {
  if (!Number.isInteger(value)) {
    throw new Error("EMAIL_SMTP_PORT must be between 1 and 65535 when local SMTP is configured.");
  }

  if (value <= 0) {
    throw new Error("EMAIL_SMTP_PORT must be between 1 and 65535 when local SMTP is configured.");
  }
};

const assertPortUpperBound = (value: number) => {
  if (value > 65535) {
    throw new Error("EMAIL_SMTP_PORT must be between 1 and 65535 when local SMTP is configured.");
  }
};

const parseSmtpPort = (value: string) => {
  assertDigitsOnly(value);
  const parsed = Number.parseInt(value, 10);
  assertPositiveInteger(parsed);
  assertPortUpperBound(parsed);
  return parsed;
};

export interface LocalSmtpEmailConfig {
  mode: "smtp";
  host: string;
  port: number;
}

export interface ProviderEmailConfig {
  mode: "provider";
  apiKey: string;
}

export type EmailConfig = LocalSmtpEmailConfig | ProviderEmailConfig;

const normalizeSmtpHost = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeSmtpPort = (value: unknown) => {
  if (typeof value === "number") {
    assertPositiveInteger(value);
    assertPortUpperBound(value);
    return value;
  }

  if (typeof value === "string") {
    return parseSmtpPort(value.trim());
  }

  return undefined;
};

const createLocalSmtpConfig = (input: EmailConfigInput): LocalSmtpEmailConfig | null => {
  const smtpHost = normalizeSmtpHost(input.EMAIL_SMTP_HOST);
  const smtpPort = normalizeSmtpPort(input.EMAIL_SMTP_PORT);

  if (!hasValue(smtpHost) && !hasPortValue(smtpPort)) {
    return null;
  }

  if (!hasValue(smtpHost) || !hasPortValue(smtpPort)) {
    throw new Error(
      "Local SMTP config requires both EMAIL_SMTP_HOST and EMAIL_SMTP_PORT to be set together.",
    );
  }

  return {
    mode: "smtp",
    host: smtpHost,
    port: smtpPort,
  };
};

const createProviderConfig = (input: EmailConfigInput): ProviderEmailConfig => {
  const providerApiKey = normalizeSmtpHost(input.EMAIL_PROVIDER_API_KEY);

  if (!hasValue(providerApiKey)) {
    throw new Error("EMAIL_PROVIDER_API_KEY is required when local SMTP is not configured.");
  }

  return {
    mode: "provider",
    apiKey: providerApiKey,
  };
};

export const resolveEmailConfig = (input: EmailConfigInput): EmailConfig =>
  createLocalSmtpConfig(input) ?? createProviderConfig(input);
