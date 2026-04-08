export type NotificationSummary = {
  id: string;
  type: string;
  workspaceId: string | null;
  title: string;
  body: string;
  url: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationListSuccessEnvelope = {
  data?: {
    items?: unknown[];
  };
  meta?: {
    requestId?: unknown;
  };
};

type NotificationUnreadCountSuccessEnvelope = {
  data?: {
    unreadCount?: unknown;
  };
  meta?: {
    requestId?: unknown;
  };
};

type NotificationMutationSuccessEnvelope = {
  data?: {
    id?: unknown;
    isRead?: unknown;
    readAt?: unknown;
    updatedCount?: unknown;
  };
  meta?: {
    requestId?: unknown;
  };
};

type NotificationErrorEnvelope = {
  error?: {
    code?: unknown;
  };
  meta?: {
    requestId?: unknown;
  };
};

type NotificationFetchOptions = {
  accessToken?: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

type NotificationOperation = "load" | "update";

export type NotificationApiErrorKind =
  | "auth"
  | "forbidden"
  | "network"
  | "not-found"
  | "server"
  | "unknown"
  | "validation";

const notificationOperationMessages: Record<
  NotificationOperation,
  Record<NotificationApiErrorKind, string>
> = {
  load: {
    auth: "Your session has expired. Please sign in again.",
    forbidden: "You don't have access to these notifications.",
    network: "Failed to load notifications. Check your connection and retry.",
    "not-found": "The notifications service is not available in this environment yet.",
    server: "Failed to load notifications. Please try again.",
    unknown: "Failed to load notifications.",
    validation: "The notifications request could not be completed.",
  },
  update: {
    auth: "Your session has expired. Please sign in again.",
    forbidden: "You don't have access to update this notification.",
    network: "Failed to update notifications. Check your connection and retry.",
    "not-found": "The selected notification is not available in this environment yet.",
    server: "Failed to update notifications. Please try again.",
    unknown: "Failed to update notifications.",
    validation: "The notification update could not be completed.",
  },
};

const notificationMalformedMessages: Record<NotificationOperation, string> = {
  load: "The notifications response was malformed.",
  update: "The notification update response was malformed.",
};

const notificationErrorKindsByStatus: Record<number, NotificationApiErrorKind> = {
  400: "validation",
  401: "auth",
  403: "forbidden",
  404: "not-found",
};

export class NotificationApiError extends Error {
  kind: NotificationApiErrorKind;
  requestId: string | null;
  status: number | null;

  constructor(
    kind: NotificationApiErrorKind,
    message: string,
    options?: { requestId?: string | null; status?: number | null },
  ) {
    super(message);
    this.name = "NotificationApiError";
    this.kind = kind;
    this.requestId = options?.requestId ?? null;
    this.status = options?.status ?? null;
  }
}

export const notificationUnreadCountQueryKey = ["notifications", "unread-count"] as const;
export const recentNotificationsQueryKey = ["notifications", "list", "recent"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Notifications response is missing a valid ${field}.`);
  }

  return value;
};

const readBoolean = (value: unknown, field: string) => {
  if (typeof value !== "boolean") {
    throw new Error(`Notifications response is missing a valid ${field}.`);
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

  throw new Error("Notifications response contains an invalid string field.");
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

const readNotificationItems = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  return Array.isArray(payload.data.items) ? payload.data.items : null;
};

const parseNotificationSummary = (item: unknown): NotificationSummary => {
  if (!isRecord(item)) {
    throw new Error("Notifications response contains a malformed notification.");
  }

  return {
    id: readString(item.id, "notification id"),
    type: readString(item.type, "notification type"),
    workspaceId: readNullableString(item.workspaceId),
    title: readString(item.title, "notification title"),
    body: readString(item.body, "notification body"),
    url: readString(item.url, "notification url"),
    isRead: readBoolean(item.isRead, "notification read flag"),
    createdAt: readString(item.createdAt, "notification createdAt"),
  };
};

const getCreatedAtTimestamp = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

export const sortNotificationsByRecency = (
  notifications: readonly NotificationSummary[],
) =>
  [...notifications].sort((left, right) => {
    const createdAtDelta =
      getCreatedAtTimestamp(right.createdAt) - getCreatedAtTimestamp(left.createdAt);

    if (!Number.isNaN(createdAtDelta) && createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
  });

export const parseNotificationListResponse = (payload: unknown) => {
  const items = readNotificationItems(payload);

  if (!items) {
    throw new Error("Notifications response does not match the expected list envelope.");
  }

  return sortNotificationsByRecency(items.map(parseNotificationSummary));
};

export const parseNotificationUnreadCountResponse = (payload: unknown) => {
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    typeof payload.data.unreadCount !== "number"
  ) {
    throw new Error("Notifications unread count response does not match the expected envelope.");
  }

  return payload.data.unreadCount;
};

const readNotificationErrorCode = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null;
  }

  return readNonEmptyString(payload.error.code);
};

const getNotificationErrorKindFromStatus = (
  status: number,
  errorCode: string | null,
): NotificationApiErrorKind => {
  if (errorCode === "UNAUTHORIZED") {
    return "auth";
  }

  if (errorCode === "FORBIDDEN" || errorCode === "NOT_WORKSPACE_MEMBER") {
    return "forbidden";
  }

  if (errorCode === "VALIDATION_ERROR") {
    return "validation";
  }

  const exactStatusKind = notificationErrorKindsByStatus[status];

  if (exactStatusKind) {
    return exactStatusKind;
  }

  return status >= 500 ? "server" : "unknown";
};

const getNotificationErrorMessage = (
  operation: NotificationOperation,
  kind: NotificationApiErrorKind,
) => notificationOperationMessages[operation][kind];

const toNotificationApiError = (
  status: number,
  payload: unknown,
  operation: NotificationOperation,
) => {
  const kind = getNotificationErrorKindFromStatus(status, readNotificationErrorCode(payload));

  return new NotificationApiError(kind, getNotificationErrorMessage(operation, kind), {
    requestId: readRequestId(payload),
    status,
  });
};

const toMalformedNotificationResponseError = (
  payload: unknown,
  status: number,
  operation: NotificationOperation,
) =>
  new NotificationApiError("unknown", notificationMalformedMessages[operation], {
    requestId: readRequestId(payload),
    status,
  });

const parseNotificationListResponseOrThrow = (payload: unknown, status: number) => {
  try {
    return parseNotificationListResponse(payload).slice(0, 10);
  } catch {
    throw toMalformedNotificationResponseError(payload, status, "load");
  }
};

const parseNotificationUnreadCountResponseOrThrow = (payload: unknown, status: number) => {
  try {
    return parseNotificationUnreadCountResponse(payload);
  } catch {
    throw toMalformedNotificationResponseError(payload, status, "load");
  }
};

const parseNotificationMutationResponseOrThrow = (
  payload: unknown,
  status: number,
  operation: NotificationOperation,
) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw toMalformedNotificationResponseError(payload, status, operation);
  }

  return payload.data;
};

const isAbortLikeError = (error: unknown): error is { name: string } =>
  isRecord(error) && error.name === "AbortError";

const buildNotificationRequestHeaders = (accessToken?: string) => ({
  Accept: "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

const readResponsePayload = async (response: Response) => {
  try {
    return (await response.json()) as
      | NotificationListSuccessEnvelope
      | NotificationUnreadCountSuccessEnvelope
      | NotificationMutationSuccessEnvelope
      | NotificationErrorEnvelope;
  } catch {
    return null;
  }
};

const classifyUnexpectedNotificationError = (
  error: unknown,
  operation: NotificationOperation,
): never => {
  if (isAbortLikeError(error)) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new NotificationApiError(
      "network",
      getNotificationErrorMessage(operation, "network"),
    );
  }

  throw new NotificationApiError(
    "unknown",
    getNotificationErrorMessage(operation, "unknown"),
  );
};

export async function readNotificationUnreadCount({
  accessToken,
  fetchFn = fetch,
  signal,
}: NotificationFetchOptions = {}) {
  try {
    const response = await fetchFn("/api/v1/notifications/unread-count", {
      method: "GET",
      credentials: "include",
      headers: buildNotificationRequestHeaders(accessToken),
      signal,
    });
    const payload = await readResponsePayload(response);

    if (!response.ok) {
      throw toNotificationApiError(response.status, payload, "load");
    }

    return parseNotificationUnreadCountResponseOrThrow(payload, response.status);
  } catch (error) {
    if (error instanceof NotificationApiError) {
      throw error;
    }

    classifyUnexpectedNotificationError(error, "load");
  }
}

export async function listRecentNotifications({
  accessToken,
  fetchFn = fetch,
  signal,
}: NotificationFetchOptions = {}) {
  try {
    const response = await fetchFn("/api/v1/notifications?page=1&pageSize=10", {
      method: "GET",
      credentials: "include",
      headers: buildNotificationRequestHeaders(accessToken),
      signal,
    });
    const payload = await readResponsePayload(response);

    if (!response.ok) {
      throw toNotificationApiError(response.status, payload, "load");
    }

    return parseNotificationListResponseOrThrow(payload, response.status);
  } catch (error) {
    if (error instanceof NotificationApiError) {
      throw error;
    }

    classifyUnexpectedNotificationError(error, "load");
  }
}

export async function markNotificationAsRead(
  notificationId: string,
  { accessToken, fetchFn = fetch, signal }: NotificationFetchOptions = {},
) {
  if (typeof notificationId !== "string" || notificationId.trim().length === 0) {
    throw new NotificationApiError(
      "validation",
      notificationOperationMessages.update.validation,
    );
  }

  try {
    const response = await fetchFn(
      `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
      {
      method: "PATCH",
      credentials: "include",
      headers: {
        ...buildNotificationRequestHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isRead: true }),
      signal,
      },
    );
    const payload = await readResponsePayload(response);

    if (!response.ok) {
      throw toNotificationApiError(response.status, payload, "update");
    }

    const data = parseNotificationMutationResponseOrThrow(payload, response.status, "update");
    return {
      id: readString(data.id, "notification id"),
      isRead: readBoolean(data.isRead, "notification read flag"),
      readAt: readNullableString(data.readAt),
    };
  } catch (error) {
    if (error instanceof NotificationApiError) {
      throw error;
    }

    classifyUnexpectedNotificationError(error, "update");
  }
}

export async function markAllNotificationsAsRead({
  accessToken,
  fetchFn = fetch,
  signal,
}: NotificationFetchOptions = {}) {
  try {
    const response = await fetchFn("/api/v1/notifications/mark-all-read", {
      method: "PATCH",
      credentials: "include",
      headers: buildNotificationRequestHeaders(accessToken),
      signal,
    });
    const payload = await readResponsePayload(response);

    if (!response.ok) {
      throw toNotificationApiError(response.status, payload, "update");
    }

    const data = parseNotificationMutationResponseOrThrow(payload, response.status, "update");

    if (typeof data.updatedCount !== "number") {
      throw toMalformedNotificationResponseError(payload, response.status, "update");
    }

    return data.updatedCount;
  } catch (error) {
    if (error instanceof NotificationApiError) {
      throw error;
    }

    classifyUnexpectedNotificationError(error, "update");
  }
}
