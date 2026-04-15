export type AuthApiErrorKind =
  | "auth"
  | "conflict"
  | "network"
  | "rate-limited"
  | "server"
  | "token-expired"
  | "token-invalid"
  | "unknown"
  | "validation";

export type AuthApiErrorCode =
  | "ACCOUNT_DEACTIVATED"
  | "EMAIL_ALREADY_EXISTS"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "TOKEN_ALREADY_USED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  globalRole: string;
  isVerified: boolean;
};

type AuthApiErrorOptions = {
  code?: AuthApiErrorCode | null;
  requestId?: string | null;
  status?: number | null;
};

type AuthRequestOptions = {
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

type AuthEnvelope = {
  data?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
  };
  meta?: {
    requestId?: unknown;
  };
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

type EmailOnlyInput = {
  email: string;
};

type TokenInput = {
  token: string;
};

type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

type AuthOperation =
  | "forgotPassword"
  | "login"
  | "logout"
  | "register"
  | "resendVerification"
  | "resetPassword"
  | "verifyEmail";

const authOperationMessages: Record<
  AuthOperation,
  Record<AuthApiErrorKind, string>
> = {
  forgotPassword: {
    auth: "Password reset could not be completed for this session.",
    conflict: "Password reset could not be completed.",
    network: "Password reset could not reach the server. Check the connection and retry.",
    "rate-limited": "Too many reset requests were sent. Wait and try again.",
    server: "Password reset could not be completed. Retry in a moment.",
    "token-expired": "Password reset could not be completed.",
    "token-invalid": "Password reset could not be completed.",
    unknown: "Password reset could not be completed.",
    validation: "Enter a valid email address before requesting a reset.",
  },
  login: {
    auth: "Sign in could not be completed with those credentials.",
    conflict: "Sign in could not be completed.",
    network: "Sign in could not reach the server. Check the connection and retry.",
    "rate-limited": "Too many sign-in attempts were made. Wait and try again.",
    server: "Sign in could not be completed. Retry in a moment.",
    "token-expired": "Sign in could not be completed.",
    "token-invalid": "Sign in could not be completed.",
    unknown: "Sign in could not be completed.",
    validation: "Enter a valid email address and password before signing in.",
  },
  logout: {
    auth: "Sign out could not be completed.",
    conflict: "Sign out could not be completed.",
    network: "Sign out could not reach the server. Check the connection and retry.",
    "rate-limited": "Sign out could not be completed.",
    server: "Sign out could not be completed. Retry in a moment.",
    "token-expired": "Sign out could not be completed.",
    "token-invalid": "Sign out could not be completed.",
    unknown: "Sign out could not be completed.",
    validation: "Sign out could not be completed.",
  },
  register: {
    auth: "Registration could not be completed for this account.",
    conflict: "An account already exists for this email address.",
    network: "Registration could not reach the server. Check the connection and retry.",
    "rate-limited": "Too many registration attempts were made. Wait and try again.",
    server: "Registration could not be completed. Retry in a moment.",
    "token-expired": "Registration could not be completed.",
    "token-invalid": "Registration could not be completed.",
    unknown: "Registration could not be completed.",
    validation: "Check the registration form and correct the highlighted fields.",
  },
  resendVerification: {
    auth: "Verification resend could not be completed.",
    conflict: "Verification resend could not be completed.",
    network:
      "Verification resend could not reach the server. Check the connection and retry.",
    "rate-limited": "Too many verification emails were requested. Wait and try again.",
    server: "Verification resend could not be completed. Retry in a moment.",
    "token-expired": "Verification resend could not be completed.",
    "token-invalid": "Verification resend could not be completed.",
    unknown: "Verification resend could not be completed.",
    validation: "Enter a valid email address before requesting another email.",
  },
  resetPassword: {
    auth: "Password update could not be completed for this account.",
    conflict: "Password update could not be completed.",
    network: "Password update could not reach the server. Check the connection and retry.",
    "rate-limited": "Too many password reset attempts were made. Wait and try again.",
    server: "Password update could not be completed. Retry in a moment.",
    "token-expired": "This reset link has expired. Request a new one.",
    "token-invalid": "This reset link is invalid or has already been used.",
    unknown: "Password update could not be completed.",
    validation: "Use a valid reset link and a password that meets policy.",
  },
  verifyEmail: {
    auth: "Email verification could not be completed for this account.",
    conflict: "Email verification could not be completed.",
    network: "Email verification could not reach the server. Check the connection and retry.",
    "rate-limited": "Email verification could not be completed right now.",
    server: "Email verification could not be completed. Retry in a moment.",
    "token-expired": "This verification link has expired. Request a new email.",
    "token-invalid": "This verification link is invalid or has already been used.",
    unknown: "Email verification could not be completed.",
    validation: "Use a valid verification link before retrying.",
  },
};

const authErrorKindsByStatus: Record<number, AuthApiErrorKind> = {
  400: "validation",
  401: "auth",
  403: "auth",
  409: "conflict",
  410: "token-expired",
  429: "rate-limited",
};

const authErrorKindsByCode: Partial<Record<AuthApiErrorCode, AuthApiErrorKind>> = {
  ACCOUNT_DEACTIVATED: "auth",
  EMAIL_ALREADY_EXISTS: "conflict",
  EMAIL_NOT_VERIFIED: "auth",
  INVALID_CREDENTIALS: "auth",
  RATE_LIMITED: "rate-limited",
  TOKEN_ALREADY_USED: "token-invalid",
  TOKEN_EXPIRED: "token-expired",
  TOKEN_INVALID: "token-invalid",
  UNAUTHORIZED: "auth",
  VALIDATION_ERROR: "validation",
};

export class AuthApiError extends Error {
  readonly kind: AuthApiErrorKind;
  readonly code: AuthApiErrorCode | null;
  readonly requestId: string | null;
  readonly status: number | null;

  constructor(
    kind: AuthApiErrorKind,
    message: string,
    options?: AuthApiErrorOptions,
  ) {
    super(message);
    this.name = "AuthApiError";
    this.kind = kind;
    this.code = options?.code ?? null;
    this.requestId = options?.requestId ?? null;
    this.status = options?.status ?? null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAbortLikeError = (error: unknown): error is { name: string } =>
  isRecord(error) && error.name === "AbortError";

const readNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : null;

const malformedAuthResponseMessage =
  "The authentication response was malformed. Please try again.";

const readString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new AuthApiError(
      "unknown",
      `${malformedAuthResponseMessage} Missing ${field}.`,
    );
  }

  return value;
};

const readBoolean = (value: unknown, field: string) => {
  if (typeof value !== "boolean") {
    throw new AuthApiError(
      "unknown",
      `${malformedAuthResponseMessage} Missing ${field}.`,
    );
  }

  return value;
};

const readRequestId = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.meta)) {
    return null;
  }

  return readNonEmptyString(payload.meta.requestId);
};

const readErrorCode = (payload: unknown): AuthApiErrorCode | null => {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null;
  }

  const code = readNonEmptyString(payload.error.code);
  return code as AuthApiErrorCode | null;
};

const readJsonSafely = async (response: Response) => {
  try {
    return (await response.json()) as AuthEnvelope;
  } catch {
    return null;
  }
};

const readDataRecord = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new AuthApiError("unknown", malformedAuthResponseMessage);
  }

  return payload.data;
};

const getAuthErrorKind = (
  status: number,
  code: AuthApiErrorCode | null,
): AuthApiErrorKind => {
  if (code) {
    const kind = authErrorKindsByCode[code];
    if (kind) {
      return kind;
    }
  }

  const exact = authErrorKindsByStatus[status];
  if (exact) {
    return exact;
  }

  return status >= 500 ? "server" : "unknown";
};

const createAuthApiError = (
  operation: AuthOperation,
  status: number,
  payload: unknown,
) => {
  const code = readErrorCode(payload);
  const kind = getAuthErrorKind(status, code);
  return new AuthApiError(kind, authOperationMessages[operation][kind], {
    code,
    requestId: readRequestId(payload),
    status,
  });
};

const classifyUnexpectedAuthError = (
  error: unknown,
  operation: AuthOperation,
): never => {
  if (isAbortLikeError(error)) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new AuthApiError(
      "network",
      authOperationMessages[operation].network,
    );
  }

  throw new AuthApiError("unknown", authOperationMessages[operation].unknown);
};

const postAuthJson = async (
  path: string,
  body: Record<string, unknown> | undefined,
  {
    fetchFn = fetch,
    operation,
    signal,
  }: AuthRequestOptions & { operation: AuthOperation },
) => {
  try {
    const response = await fetchFn(path, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    const payload = await readJsonSafely(response);
    if (!response.ok) {
      throw createAuthApiError(operation, response.status, payload);
    }

    return payload;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    throw classifyUnexpectedAuthError(error, operation);
  }
};

const readMessage = (payload: unknown) =>
  readString(readDataRecord(payload).message, "message");

const readUser = (payload: unknown): AuthUser => {
  const data = readDataRecord(payload);
  if (!isRecord(data.user)) {
    throw new AuthApiError("unknown", malformedAuthResponseMessage);
  }

  return {
    id: readString(data.user.id, "user id"),
    email: readString(data.user.email, "user email"),
    fullName: readString(data.user.fullName, "user full name"),
    globalRole: readString(data.user.globalRole, "user role"),
    isVerified: readBoolean(data.user.isVerified, "user verification flag"),
  };
};

const readAccessToken = (payload: unknown) =>
  readString(readDataRecord(payload).accessToken, "access token");

const runAuthOperation = async <T>(
  path: string,
  body: Record<string, unknown> | undefined,
  operation: AuthOperation,
  readResult: (payload: unknown) => T,
  options?: AuthRequestOptions,
) => {
  const payload = await postAuthJson(path, body, {
    ...options,
    operation,
  });

  return readResult(payload);
};

const runMessageOperation = (
  path: string,
  input: Record<string, unknown>,
  operation: AuthOperation,
  options?: AuthRequestOptions,
) =>
  runAuthOperation(path, input, operation, (payload) => ({
    message: readMessage(payload),
  }), options);

export const registerAccount = async (
  input: RegisterInput,
  options?: AuthRequestOptions,
) => runMessageOperation("/api/v1/auth/register", input, "register", options);

export const loginWithPassword = async (
  input: LoginInput,
  options?: AuthRequestOptions,
) =>
  runAuthOperation(
    "/api/v1/auth/login",
    input,
    "login",
    (payload) => ({
    accessToken: readAccessToken(payload),
    user: readUser(payload),
    }),
    options,
  );

export const requestPasswordReset = async (
  input: EmailOnlyInput,
  options?: AuthRequestOptions,
) =>
  runMessageOperation(
    "/api/v1/auth/forgot-password",
    input,
    "forgotPassword",
    options,
  );

export const resendVerificationEmail = async (
  input: EmailOnlyInput,
  options?: AuthRequestOptions,
) =>
  runMessageOperation(
    "/api/v1/auth/resend-verification",
    input,
    "resendVerification",
    options,
  );

export const verifyEmailToken = async (
  input: TokenInput,
  options?: AuthRequestOptions,
) => runMessageOperation("/api/v1/auth/verify-email", input, "verifyEmail", options);

export const resetPassword = async (
  input: ResetPasswordInput,
  options?: AuthRequestOptions,
) =>
  runMessageOperation(
    "/api/v1/auth/reset-password",
    input,
    "resetPassword",
    options,
  );

export const logoutCurrentSession = async (options?: AuthRequestOptions) => {
  await runAuthOperation(
    "/api/v1/auth/logout",
    undefined,
    "logout",
    () => undefined,
    options,
  );
};
