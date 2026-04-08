export type WorkspaceType = "professional" | "academic" | "general";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export type WorkspaceSummary = {
  id: string;
  name: string;
  description: string | null;
  type: WorkspaceType;
  icon: string | null;
  myRole: WorkspaceRole;
  roleLabel: string;
  lastAccessedAt: string | null;
  createdAt: string;
};

export type WorkspaceListSuccessEnvelope = {
  data?: {
    items?: unknown[];
    total?: number;
  };
  meta?: {
    requestId?: unknown;
  };
};

type WorkspaceErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
  meta?: {
    requestId?: unknown;
  };
};

type WorkspaceFetchOptions = {
  accessToken?: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

export type WorkspaceApiErrorKind =
  | "auth"
  | "network"
  | "not-found"
  | "server"
  | "unknown";

const workspaceTypes = new Set<WorkspaceType>(["professional", "academic", "general"]);
const workspaceRoles = new Set<WorkspaceRole>([
  "OWNER",
  "ADMIN",
  "MANAGER",
  "MEMBER",
  "VIEWER",
]);

const workspaceApiMessages = {
  auth:
    "Workspace access could not be verified for this request. Retry after a valid authenticated session is available.",
  malformed: "The workspace list response was malformed.",
  network: "The workspace list could not be reached. Check the connection and retry.",
  notFound: "The workspace list endpoint is not available in this environment yet.",
  server: "The workspace service failed to respond. Retry in a moment.",
  unknown: "The workspace list request could not be completed.",
} as const;

export class WorkspaceApiError extends Error {
  kind: WorkspaceApiErrorKind;
  requestId: string | null;
  status: number | null;

  constructor(
    kind: WorkspaceApiErrorKind,
    message: string,
    options?: { requestId?: string | null; status?: number | null },
  ) {
    super(message);
    this.name = "WorkspaceApiError";
    this.kind = kind;
    this.requestId = options?.requestId ?? null;
    this.status = options?.status ?? null;
  }
}

export const workspaceListQueryKey = ["workspaces", "list"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Workspace list response is missing a valid ${field}.`);
  }

  return value;
};

const readNullableString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return null;
  }

  throw new Error("Workspace list response contains an invalid string field.");
};

const readWorkspaceType = (value: unknown) => {
  if (typeof value === "string" && workspaceTypes.has(value as WorkspaceType)) {
    return value as WorkspaceType;
  }

  throw new Error("Workspace list response contains an invalid workspace type.");
};

const readWorkspaceRole = (value: unknown) => {
  if (typeof value === "string" && workspaceRoles.has(value as WorkspaceRole)) {
    return value as WorkspaceRole;
  }

  throw new Error("Workspace list response contains an invalid workspace role.");
};

const readNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : null;

const readMetaRecord = (payload: unknown) => {
  if (!isRecord(payload)) {
    return null;
  }

  return isRecord(payload.meta) ? payload.meta : null;
};

const readRequestId = (payload: unknown) =>
  readNonEmptyString(readMetaRecord(payload)?.requestId);

const readWorkspaceItems = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  return Array.isArray(payload.data.items) ? payload.data.items : null;
};

const parseWorkspaceSummary = (item: unknown): WorkspaceSummary => {
  if (!isRecord(item)) {
    throw new Error("Workspace list response contains a malformed workspace.");
  }

  return {
    id: readString(item.id, "workspace id"),
    name: readString(item.name, "workspace name"),
    description: readNullableString(item.description),
    type: readWorkspaceType(item.type),
    icon: readNullableString(item.icon),
    myRole: readWorkspaceRole(item.myRole),
    roleLabel: readString(item.roleLabel, "workspace role label"),
    lastAccessedAt: readNullableString(item.lastAccessedAt),
    createdAt: readString(item.createdAt, "workspace createdAt"),
  };
};

export const sortWorkspacesForSwitcher = (workspaces: readonly WorkspaceSummary[]) => {
  const byAccessTime = (value: string | null) => {
    if (!value) {
      return Number.NEGATIVE_INFINITY;
    }

    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
  };

  return [...workspaces].sort((left, right) => {
    const accessDelta = byAccessTime(right.lastAccessedAt) - byAccessTime(left.lastAccessedAt);

    if (accessDelta !== 0) {
      return accessDelta;
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
  });
};

export const parseWorkspaceListResponse = (payload: unknown) => {
  const items = readWorkspaceItems(payload);

  if (!items) {
    throw new Error("Workspace list response does not match the expected list envelope.");
  }

  return sortWorkspacesForSwitcher(items.map(parseWorkspaceSummary));
};

const readWorkspaceErrorCode = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null;
  }

  return readNonEmptyString(payload.error.code);
};

const workspaceErrorKindsByStatus: Record<number, WorkspaceApiErrorKind> = {
  401: "auth",
  403: "auth",
  404: "not-found",
};

const getWorkspaceErrorKindFromStatus = (
  status: number,
  errorCode: string | null,
): WorkspaceApiErrorKind => {
  if (errorCode === "UNAUTHORIZED") {
    return "auth";
  }

  const exactStatusKind = workspaceErrorKindsByStatus[status];

  if (exactStatusKind) {
    return exactStatusKind;
  }

  return status >= 500 ? "server" : "unknown";
};

const getWorkspaceErrorMessage = (kind: WorkspaceApiErrorKind) => {
  if (kind === "auth") {
    return workspaceApiMessages.auth;
  }

  if (kind === "not-found") {
    return workspaceApiMessages.notFound;
  }

  if (kind === "server") {
    return workspaceApiMessages.server;
  }

  return workspaceApiMessages.unknown;
};

const toWorkspaceApiError = (status: number, payload: unknown): WorkspaceApiError => {
  const errorCode = readWorkspaceErrorCode(payload);
  const kind = getWorkspaceErrorKindFromStatus(status, errorCode);
  return new WorkspaceApiError(kind, getWorkspaceErrorMessage(kind), {
    requestId: readRequestId(payload),
    status,
  });
};

const toMalformedWorkspaceResponseError = (payload: unknown, status: number) =>
  new WorkspaceApiError("unknown", workspaceApiMessages.malformed, {
    requestId: readRequestId(payload),
    status,
  });

const parseWorkspaceListResponseOrThrow = (payload: unknown, status: number) => {
  try {
    return parseWorkspaceListResponse(payload);
  } catch {
    throw toMalformedWorkspaceResponseError(payload, status);
  }
};

const isAbortLikeError = (error: unknown): error is { name: string } =>
  isRecord(error) && error.name === "AbortError";

export async function listWorkspaces({
  accessToken,
  fetchFn = fetch,
  signal,
}: WorkspaceFetchOptions = {}) {
  try {
    const response = await fetchFn("/api/v1/workspaces", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      signal,
    });

    let payload: WorkspaceListSuccessEnvelope | WorkspaceErrorEnvelope | null = null;

    try {
      payload = (await response.json()) as WorkspaceListSuccessEnvelope | WorkspaceErrorEnvelope;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw toWorkspaceApiError(response.status, payload);
    }

    return parseWorkspaceListResponseOrThrow(payload, response.status);
  } catch (error) {
    if (error instanceof WorkspaceApiError) {
      throw error;
    }

    if (isAbortLikeError(error)) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new WorkspaceApiError("network", workspaceApiMessages.network);
    }

    throw new WorkspaceApiError(
      "unknown",
      workspaceApiMessages.unknown,
    );
  }
}
