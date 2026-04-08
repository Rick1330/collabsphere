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

const readRequestId = (payload: unknown) => {
  if (!isRecord(payload)) {
    return null;
  }

  const meta = payload.meta;

  if (!isRecord(meta) || typeof meta.requestId !== "string" || meta.requestId.length === 0) {
    return null;
  }

  return meta.requestId;
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
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.items)) {
    throw new Error("Workspace list response does not match the expected list envelope.");
  }

  return sortWorkspacesForSwitcher(payload.data.items.map(parseWorkspaceSummary));
};

const toWorkspaceApiError = (
  status: number,
  payload: unknown,
): WorkspaceApiError => {
  const requestId = readRequestId(payload);
  const message =
    isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string"
      ? payload.error.message
      : null;

  if (status === 401 || status === 403) {
    return new WorkspaceApiError(
      "auth",
      message ??
        "Workspace access could not be verified for this request. Retry after a valid authenticated session is available.",
      { requestId, status },
    );
  }

  if (status === 404) {
    return new WorkspaceApiError(
      "not-found",
      message ??
        "The workspace list endpoint is not available in this environment yet.",
      { requestId, status },
    );
  }

  if (status >= 500) {
    return new WorkspaceApiError(
      "server",
      message ?? "The workspace service failed to respond. Retry in a moment.",
      { requestId, status },
    );
  }

  return new WorkspaceApiError(
    "unknown",
    message ?? "The workspace list request could not be completed.",
    { requestId, status },
  );
};

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

    return parseWorkspaceListResponse(payload);
  } catch (error) {
    if (error instanceof WorkspaceApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new WorkspaceApiError(
      "network",
      "The workspace list could not be reached. Check the connection and retry.",
    );
  }
}
