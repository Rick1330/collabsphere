export type MyActivityItem = {
  id: string;
  actorName: string;
  summary: string;
  workspaceId: string | null;
  workspaceName: string | null;
  createdAt: string;
  url: string | null;
};

type ActivityEnvelope = {
  data?: {
    items?: unknown[];
  };
  meta?: {
    requestId?: unknown;
  };
};

type ActivityFetchOptions = {
  accessToken?: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

export type ActivityApiErrorKind = "auth" | "network" | "not-found" | "server" | "unknown";

export class ActivityApiError extends Error {
  kind: ActivityApiErrorKind;
  requestId: string | null;

  constructor(kind: ActivityApiErrorKind, message: string, requestId?: string | null) {
    super(message);
    this.name = "ActivityApiError";
    this.kind = kind;
    this.requestId = requestId ?? null;
  }
}

export const myActivityQueryKey = ["activity", "mine"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Activity response is missing a valid ${field}.`);
  }

  return value;
};

const readNullableString = (value: unknown) => {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new Error("Activity response contains an invalid nullable string.");
};

const readRequestId = (payload: unknown) =>
  isRecord(payload) && isRecord(payload.meta) && typeof payload.meta.requestId === "string"
    ? payload.meta.requestId
    : null;

const isAbortLikeError = (error: unknown): error is { name: string } =>
  isRecord(error) && error.name === "AbortError";

const parseActivityItem = (item: unknown): MyActivityItem => {
  if (!isRecord(item)) {
    throw new Error("Activity response contains a malformed item.");
  }

  return {
    id: readString(item.id, "activity id"),
    actorName: readString(item.actorName, "activity actor"),
    summary: readString(item.summary, "activity summary"),
    workspaceId: readNullableString(item.workspaceId),
    workspaceName: readNullableString(item.workspaceName),
    createdAt: readString(item.createdAt, "activity createdAt"),
    url: readNullableString(item.url),
  };
};

const toActivityApiError = (status: number, payload: unknown) => {
  const requestId = readRequestId(payload);

  if (status === 401 || status === 403) {
    return new ActivityApiError("auth", "Activity access could not be verified for this session.", requestId);
  }

  if (status === 404) {
    return new ActivityApiError(
      "not-found",
      "Your personal activity feed is not available in this environment yet.",
      requestId,
    );
  }

  if (status >= 500) {
    return new ActivityApiError("server", "The activity feed failed to respond. Retry in a moment.", requestId);
  }

  return new ActivityApiError("unknown", "The activity feed could not be completed.", requestId);
};

export async function listMyActivity({
  accessToken,
  fetchFn = fetch,
  signal,
}: ActivityFetchOptions = {}) {
  try {
    const response = await fetchFn("/api/v1/activity/mine?page=1&pageSize=10", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      signal,
    });
    const payload = (await response.json().catch(() => null)) as ActivityEnvelope | null;

    if (!response.ok) {
      throw toActivityApiError(response.status, payload);
    }

    const items = payload?.data?.items;
    if (!Array.isArray(items)) {
      throw new ActivityApiError("unknown", "The activity feed response was malformed.", readRequestId(payload));
    }

    return items.map(parseActivityItem);
  } catch (error) {
    if (error instanceof ActivityApiError) {
      throw error;
    }

    if (isAbortLikeError(error)) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ActivityApiError("network", "The activity feed could not be reached. Check the connection and retry.");
    }

    throw new ActivityApiError("unknown", "The activity feed response was malformed.");
  }
}
