const hasValue = (value: string | undefined): value is string => typeof value === "string" && value.trim().length > 0;

const parseSmtpPort = (value: string) => {
  if (!/^\d+$/.test(value)) {
    throw new Error("EMAIL_SMTP_PORT must be a positive integer when local SMTP is configured.");
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("EMAIL_SMTP_PORT must be between 1 and 65535 when local SMTP is configured.");
  }

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

export const resolveEmailConfig = (input: Record<string, string | undefined>): EmailConfig => {
  const smtpHost = input.EMAIL_SMTP_HOST?.trim();
  const smtpPort = input.EMAIL_SMTP_PORT?.trim();
  const providerApiKey = input.EMAIL_PROVIDER_API_KEY?.trim();

  if (hasValue(smtpHost) || hasValue(smtpPort)) {
    if (!hasValue(smtpHost) || !hasValue(smtpPort)) {
      throw new Error(
        "Local SMTP config requires both EMAIL_SMTP_HOST and EMAIL_SMTP_PORT to be set together.",
      );
    }

    return {
      mode: "smtp",
      host: smtpHost,
      port: parseSmtpPort(smtpPort),
    };
  }

  if (!hasValue(providerApiKey)) {
    throw new Error("EMAIL_PROVIDER_API_KEY is required when local SMTP is not configured.");
  }

  return {
    mode: "provider",
    apiKey: providerApiKey,
  };
};
