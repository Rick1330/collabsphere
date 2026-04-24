export type ValidationErrorDetail = {
  field: string;
  message: string;
  rule: string;
};

export type ValidationErrorIssue = {
  field: string;
  message: string;
  rule?: string;
};

const defaultValidationRule = "invalid";

const normalizeValidationField = (field: string) => {
  const trimmed = field.trim();
  return trimmed.length > 0 ? trimmed : "unknown";
};

const normalizeValidationMessage = (message: string) => {
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : "Validation failed";
};

const normalizeValidationRule = (rule?: string) => {
  const trimmed = rule?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : defaultValidationRule;
};

export const createValidationErrorDetails = (
  issues: readonly ValidationErrorIssue[],
): ValidationErrorDetail[] =>
  issues.map((issue) => ({
    field: normalizeValidationField(issue.field),
    message: normalizeValidationMessage(issue.message),
    rule: normalizeValidationRule(issue.rule),
  }));
