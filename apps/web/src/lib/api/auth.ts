export type AuthApiErrorKind = "network" | "server" | "unknown";

type AuthApiErrorOptions = {
  requestId?: string | null;
  status?: number | null;
};

type LogoutCurrentSessionOptions = {
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

const authApiMessages = {
  network: "Sign out could not reach the server. Check the connection and retry.",
  server: "Sign out could not be completed. Retry in a moment.",
  unknown: "Sign out could not be completed.",
} as const;

export class AuthApiError extends Error {
  readonly kind: AuthApiErrorKind;
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
    this.requestId = options?.requestId ?? null;
    this.status = options?.status ?? null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readRequestId = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.meta)) {
    return null;
  }

  return typeof payload.meta.requestId === "string" &&
    payload.meta.requestId.length > 0
    ? payload.meta.requestId
    : null;
};

const readJsonSafely = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const createLogoutError = (status: number, payload: unknown) =>
  new AuthApiError(
    status >= 500 ? "server" : "unknown",
    status >= 500 ? authApiMessages.server : authApiMessages.unknown,
    {
      requestId: readRequestId(payload),
      status,
    },
  );

export const logoutCurrentSession = async ({
  fetchFn = fetch,
  signal,
}: LogoutCurrentSessionOptions = {}) => {
  try {
    const response = await fetchFn("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    if (response.ok) {
      return;
    }

    throw createLogoutError(response.status, await readJsonSafely(response));
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new AuthApiError("network", authApiMessages.network);
    }

    throw new AuthApiError("unknown", authApiMessages.unknown);
  }
};
